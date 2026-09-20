package com.rudra.store.dto;

public class UpdateOrderStatusRequest {
    private String orderStatus;
    private Double deliveryFee;

    public UpdateOrderStatusRequest() {
    }

    public UpdateOrderStatusRequest(String orderStatus, Double deliveryFee) {
        this.orderStatus = orderStatus;
        this.deliveryFee = deliveryFee;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public Double getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(Double deliveryFee) {
        this.deliveryFee = deliveryFee;
    }
}
