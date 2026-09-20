package com.rudra.store.service;

import com.google.cloud.firestore.Firestore;
import com.rudra.store.exception.CategoryNotFoundException;
import com.rudra.store.model.Category;
import com.rudra.store.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final Firestore firestore;

    public CategoryService(CategoryRepository categoryRepository, Firestore firestore) {
        this.categoryRepository = categoryRepository;
        this.firestore = firestore;
    }

    public List<Category> getAllActiveCategories() {
        try {
            return categoryRepository.findAllActive();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching active categories", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch active categories from Firestore", e);
        }
    }

    public List<Category> getAllCategories() {
        try {
            return categoryRepository.findAll();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching all categories", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch categories from Firestore", e);
        }
    }

    public Category getCategoryById(String id) {
        try {
            return categoryRepository.findById(id)
                    .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching category with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch category from Firestore with id: " + id, e);
        }
    }

    public Category createCategory(Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be blank");
        }

        try {
            long now = System.currentTimeMillis();
            category.setCreatedAt(now);
            category.setUpdatedAt(now);

            Category savedCategory = categoryRepository.save(category);
            logger.info("Category created successfully with id: {}", savedCategory.getId());
            return savedCategory;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while creating category", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to create category in Firestore", e);
        }
    }

    public Category updateCategory(String id, Category updatedCategory) {
        if (updatedCategory.getName() == null || updatedCategory.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Category name cannot be blank");
        }

        try {
            Category existingCategory = getCategoryById(id);

            existingCategory.setName(updatedCategory.getName());
            existingCategory.setDescription(updatedCategory.getDescription());
            existingCategory.setImageUrl(updatedCategory.getImageUrl());
            existingCategory.setActive(updatedCategory.isActive());
            existingCategory.setUpdatedAt(System.currentTimeMillis());

            Category saved = categoryRepository.save(existingCategory);
            logger.info("Category updated successfully with id: {}", saved.getId());
            return saved;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while updating category with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to update category in Firestore with id: " + id, e);
        }
    }

    public void deactivateCategory(String id) {
        try {
            Category existingCategory = getCategoryById(id);
            existingCategory.setActive(false);
            existingCategory.setUpdatedAt(System.currentTimeMillis());
            categoryRepository.save(existingCategory);
            logger.info("Category deactivated with id: {}", id);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while deactivating category with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to deactivate category in Firestore with id: " + id, e);
        }
    }

    public void deleteCategory(String id) {
        deactivateCategory(id);
    }

    public void hardDeleteCategory(String id) {
        try {
            getCategoryById(id);
            categoryRepository.deleteById(id);
            logger.info("Category permanently deleted with id: {}", id);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while deleting category with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to delete category in Firestore with id: " + id, e);
        }
    }
}
