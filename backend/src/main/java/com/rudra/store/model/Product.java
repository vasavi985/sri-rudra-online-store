package com.rudra.store.model;

import com.google.cloud.firestore.annotation.DocumentId;
import java.util.ArrayList;
import java.util.List;

public class Product {
    @DocumentId
    private String id;
    private String name;
    private String description;
    private String categoryId;
    private String imageUrl;
    private List<String> imageUrls = new ArrayList<>();
    private boolean active;
    private List<ProductVariant> variants = new ArrayList<>();
    private Long createdAt;
    private Long updatedAt;

    public Product() {
    }

    public Product(String id, String name, String description, String categoryId, String imageUrl, boolean active, List<ProductVariant> variants, Long createdAt, Long updatedAt) {
        this(id, name, description, categoryId, imageUrl, null, active, variants, createdAt, updatedAt);
    }

    public Product(String id, String name, String description, String categoryId, String imageUrl, List<String> imageUrls, boolean active, List<ProductVariant> variants, Long createdAt, Long updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.categoryId = categoryId;
        this.imageUrl = imageUrl;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        if ((this.imageUrl == null || this.imageUrl.trim().isEmpty()) && !this.imageUrls.isEmpty()) {
            this.imageUrl = this.imageUrls.get(0);
        } else if (this.imageUrl != null && !this.imageUrl.trim().isEmpty() && this.imageUrls.isEmpty()) {
            this.imageUrls.add(this.imageUrl);
        }
        this.active = active;
        this.variants = variants != null ? variants : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            if (this.imageUrls == null || this.imageUrls.isEmpty()) {
                this.imageUrls = new ArrayList<>();
                this.imageUrls.add(imageUrl);
            }
        }
    }

    public List<String> getImageUrls() {
        if ((imageUrls == null || imageUrls.isEmpty()) && imageUrl != null && !imageUrl.trim().isEmpty()) {
            List<String> fallback = new ArrayList<>();
            fallback.add(imageUrl);
            return fallback;
        }
        return imageUrls != null ? imageUrls : new ArrayList<>();
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        if (!this.imageUrls.isEmpty() && (this.imageUrl == null || this.imageUrl.trim().isEmpty())) {
            this.imageUrl = this.imageUrls.get(0);
        }
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<ProductVariant> getVariants() {
        return variants;
    }

    public void setVariants(List<ProductVariant> variants) {
        this.variants = variants != null ? variants : new ArrayList<>();
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }
}
