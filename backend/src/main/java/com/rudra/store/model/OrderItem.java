package com.rudra.store.model;

public class OrderItem {
    private String productId;
    private String productName;
    private String variantId;
    private String weight;
    private Integer quantity;
    private Double price;
    private Double subtotal;

    public OrderItem() {
    }

    public OrderItem(String productId, String productName, String variantId, String weight, Integer quantity, Double price, Double subtotal) {
        this.productId = productId;
        this.productName = productName;
        this.variantId = variantId;
        this.weight = weight;
        this.quantity = quantity;
        this.price = price;
        this.subtotal = subtotal;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }
}
