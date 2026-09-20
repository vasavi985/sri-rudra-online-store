package com.rudra.store.controller;

import com.google.firebase.auth.FirebaseToken;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.model.Product;
import com.rudra.store.service.FirebaseAuthService;
import com.rudra.store.service.ProductService;
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
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @Mock
    private FirebaseAuthService firebaseAuthService;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private ProductController productController;

    @Test
    void getAllProducts_shouldBePublicAndReturnActiveProducts() {
        Product p = new Product();
        p.setId("p1");
        p.setName("Turmeric");
        when(productService.getAllActiveProducts()).thenReturn(List.of(p));

        ResponseEntity<List<Product>> response = productController.getAllProducts();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verifyNoInteractions(firebaseAuthService);
    }

    @Test
    void getProductById_shouldBePublic() {
        Product p = new Product();
        p.setId("p1");
        when(productService.getProductById("p1")).thenReturn(p);

        ResponseEntity<Product> response = productController.getProductById("p1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verifyNoInteractions(firebaseAuthService);
    }

    @Test
    void createProduct_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        Product p = new Product();
        p.setName("New Flour");

        assertThrows(ForbiddenException.class, () ->
                productController.createProduct("Bearer customer-token", p));

        verify(productService, never()).createProduct(any());
    }

    @Test
    void createProduct_shouldSucceedForAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);
        Product p = new Product();
        p.setName("New Flour");
        Product saved = new Product();
        saved.setId("p-saved");
        saved.setName("New Flour");
        when(productService.createProduct(p)).thenReturn(saved);

        ResponseEntity<Product> response = productController.createProduct("Bearer admin-token", p);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("p-saved", response.getBody().getId());
    }

    @Test
    void updateProduct_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        Product p = new Product();
        assertThrows(ForbiddenException.class, () ->
                productController.updateProduct("Bearer customer-token", "p1", p));

        verify(productService, never()).updateProduct(any(), any());
    }

    @Test
    void updateProduct_shouldSucceedForAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);
        Product p = new Product();
        p.setName("Updated Flour");
        when(productService.updateProduct("p1", p)).thenReturn(p);

        ResponseEntity<Product> response = productController.updateProduct("Bearer admin-token", "p1", p);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Updated Flour", response.getBody().getName());
    }

    @Test
    void deleteProduct_shouldRejectNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        assertThrows(ForbiddenException.class, () ->
                productController.deleteProduct("Bearer customer-token", "p1"));

        verify(productService, never()).deleteProduct(any());
        verify(productService, never()).hardDeleteProduct(any());
    }

    @Test
    void deleteProduct_shouldHardDeleteForAdminByDefault() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);

        ResponseEntity<Void> response = productController.deleteProduct("Bearer admin-token", "p1");

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(productService).hardDeleteProduct("p1");
    }

    @Test
    void deleteProduct_shouldSoftDeleteForAdminWhenHardIsFalse() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-token")).thenReturn(firebaseToken);

        ResponseEntity<Void> response = productController.deleteProduct("Bearer admin-token", "p1", false);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(productService).deleteProduct("p1");
    }
}
