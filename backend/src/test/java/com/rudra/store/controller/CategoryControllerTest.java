package com.rudra.store.controller;

import com.google.firebase.auth.FirebaseToken;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.model.Category;
import com.rudra.store.service.CategoryService;
import com.rudra.store.service.FirebaseAuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @Mock
    private FirebaseAuthService firebaseAuthService;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private CategoryController categoryController;

    @Test
    void getAllCategories_shouldBePublic() {
        Category c = new Category();
        c.setId("cat-1");
        when(categoryService.getAllActiveCategories()).thenReturn(List.of(c));

        ResponseEntity<List<Category>> response = categoryController.getAllCategories();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verifyNoInteractions(firebaseAuthService);
    }

    @Test
    void getCategoryById_shouldBePublic() {
        Category c = new Category();
        c.setId("cat-1");
        when(categoryService.getCategoryById("cat-1")).thenReturn(c);

        ResponseEntity<Category> response = categoryController.getCategoryById("cat-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verifyNoInteractions(firebaseAuthService);
    }

    @Test
    void createCategory_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        Category c = new Category();
        assertThrows(ForbiddenException.class, () ->
                categoryController.createCategory("Bearer customer-token", c));

        verify(categoryService, never()).createCategory(any());
    }

    @Test
    void createCategory_shouldSucceedForAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);
        Category c = new Category();
        c.setName("Organic Spices");
        Category saved = new Category();
        saved.setId("cat-saved");
        saved.setName("Organic Spices");
        when(categoryService.createCategory(c)).thenReturn(saved);

        ResponseEntity<Category> response = categoryController.createCategory("Bearer admin-token", c);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("cat-saved", response.getBody().getId());
    }

    @Test
    void updateCategory_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        Category c = new Category();
        assertThrows(ForbiddenException.class, () ->
                categoryController.updateCategory("Bearer customer-token", "cat-1", c));

        verify(categoryService, never()).updateCategory(any(), any());
    }

    @Test
    void updateCategory_shouldSucceedForAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);
        Category c = new Category();
        c.setName("Flours & Millets");
        when(categoryService.updateCategory("cat-1", c)).thenReturn(c);

        ResponseEntity<Category> response = categoryController.updateCategory("Bearer admin-token", "cat-1", c);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Flours & Millets", response.getBody().getName());
    }

    @Test
    void deleteCategory_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        assertThrows(ForbiddenException.class, () ->
                categoryController.deleteCategory("Bearer customer-token", "cat-1", false));

        verify(categoryService, never()).deleteCategory(any());
        verify(categoryService, never()).hardDeleteCategory(any());
    }

    @Test
    void deleteCategory_shouldSoftDeleteForAdminByDefault() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);

        ResponseEntity<Void> response = categoryController.deleteCategory("Bearer admin-token", "cat-1", false);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(categoryService).deleteCategory("cat-1");
        verify(categoryService, never()).hardDeleteCategory(any());
    }

    @Test
    void deleteCategory_shouldHardDeleteForAdminWhenRequested() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);

        ResponseEntity<Void> response = categoryController.deleteCategory("Bearer admin-token", "cat-1", true);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(categoryService).hardDeleteCategory("cat-1");
    }
}
