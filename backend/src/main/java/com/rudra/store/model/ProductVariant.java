package com.rudra.store.model;

public class ProductVariant {
    private String variantId;
    private String weight;
    private Double price;
    private Double mrp;
    private Integer stock;
    private boolean active;

    public ProductVariant() {
    }

    public ProductVariant(String variantId, String weight, Double price, Double mrp, Integer stock, boolean active) {
        this.variantId = variantId;
        this.weight = weight;
        this.price = price;
        this.mrp = mrp;
        this.stock = stock;
        this.active = active;
    }

    public String getVariantId() {
        return variantId;
    }

    public void setVariantId(String variantId) {
        this.variantId = variantId;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getMrp() {
        return mrp;
    }

    public void setMrp(Double mrp) {
        this.mrp = mrp;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
