package com.rudra.store.controller;

import com.rudra.store.dto.CreateOrderRequest;
import com.rudra.store.model.Order;
import com.rudra.store.service.FirebaseAuthService;
import com.rudra.store.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final FirebaseAuthService firebaseAuthService;

    public OrderController(OrderService orderService, FirebaseAuthService firebaseAuthService) {
        this.orderService = orderService;
        this.firebaseAuthService = firebaseAuthService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CreateOrderRequest request) {
        String uid = firebaseAuthService.verifyTokenAndGetUid(authHeader);
        Order createdOrder = orderService.createOrder(uid, request);
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String uid = firebaseAuthService.verifyTokenAndGetUid(authHeader);
        List<Order> orders = orderService.getMyOrders(uid);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String uid = firebaseAuthService.verifyTokenAndGetUid(authHeader);
        Order order = orderService.getOrderById(id, uid);
        return ResponseEntity.ok(order);
    }
}
