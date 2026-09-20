package com.rudra.store.dto;

import com.rudra.store.model.Address;
import java.util.ArrayList;
import java.util.List;

public class CreateOrderRequest {
    private List<OrderItemRequest> items = new ArrayList<>();
    private Address address;
    private String paymentMethod = "COD";

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(List<OrderItemRequest> items, Address address) {
        this.items = items != null ? items : new ArrayList<>();
        this.address = address;
        this.paymentMethod = "COD";
    }

    public CreateOrderRequest(List<OrderItemRequest> items, Address address, String paymentMethod) {
        this.items = items != null ? items : new ArrayList<>();
        this.address = address;
        this.paymentMethod = paymentMethod != null ? paymentMethod : "COD";
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
