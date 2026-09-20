package com.rudra.store.controller;

import com.rudra.store.model.Category;
import com.rudra.store.service.CategoryService;
import com.rudra.store.service.FirebaseAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final FirebaseAuthService firebaseAuthService;

    public CategoryController(CategoryService categoryService, FirebaseAuthService firebaseAuthService) {
        this.categoryService = categoryService;
        this.firebaseAuthService = firebaseAuthService;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String id) {
        Category category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Category category) {
        firebaseAuthService.verifyAdmin(authHeader);
        Category createdCategory = categoryService.createCategory(category);
        return new ResponseEntity<>(createdCategory, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody Category category) {
        firebaseAuthService.verifyAdmin(authHeader);
        Category updatedCategory = categoryService.updateCategory(id, category);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestParam(defaultValue = "false") boolean hard) {
        firebaseAuthService.verifyAdmin(authHeader);
        if (hard) {
            categoryService.hardDeleteCategory(id);
        } else {
            categoryService.deleteCategory(id);
        }
        return ResponseEntity.noContent().build();
    }
}

