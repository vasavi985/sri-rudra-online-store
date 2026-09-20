package com.rudra.store.service;

import com.rudra.store.dto.CreateOrderRequest;
import com.rudra.store.dto.OrderItemRequest;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.exception.InvalidOrderException;
import com.rudra.store.exception.OrderNotFoundException;
import com.rudra.store.model.Address;
import com.rudra.store.model.Order;
import com.rudra.store.model.Product;
import com.rudra.store.model.ProductVariant;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    private Address validAddress;

    @BeforeEach
    void setUp() {
        validAddress = new Address(
                "Vasu Varma",
                "9876543210",
                "D.No 12-34, Main Road",
                "Near Clock Tower",
                "Rajahmundry",
                "Andhra Pradesh",
                "533101"
        );
    }

    @Test
    void createOrder_shouldRejectWhenAddressIsNull() {
        CreateOrderRequest request = new CreateOrderRequest(new ArrayList<>(), null);
        InvalidOrderException ex = assertThrows(InvalidOrderException.class, () ->
                orderService.createOrder("user-123", request));
        assertTrue(ex.getMessage().contains("Delivery address is required"));
    }

    @Test
    void createOrder_shouldRejectInvalidMobileNumber() {
        validAddress.setMobileNumber("12345"); // invalid length & starting digit
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", "var-1", 1)),
                validAddress
        );

        InvalidOrderException ex = assertThrows(InvalidOrderException.class, () ->
                orderService.createOrder("user-123", request));
        assertTrue(ex.getMessage().contains("valid 10-digit Indian mobile number"));
    }

    @Test
    void createOrder_shouldRejectInvalidPincode() {
        validAddress.setPincode("012345"); // invalid starting digit
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", "var-1", 1)),
                validAddress
        );

        InvalidOrderException ex = assertThrows(InvalidOrderException.class, () ->
                orderService.createOrder("user-123", request));
        assertTrue(ex.getMessage().contains("valid 6-digit Indian postal pincode"));
    }

    @Test
    void createOrder_shouldRejectEmptyCart() {
        CreateOrderRequest request = new CreateOrderRequest(new ArrayList<>(), validAddress);

        InvalidOrderException ex = assertThrows(InvalidOrderException.class, () ->
                orderService.createOrder("user-123", request));
        assertTrue(ex.getMessage().contains("must contain at least one item"));
    }

    @Test
    void createOrder_shouldRejectUnpricedVariant() throws Exception {
        Product mockProduct = new Product();
        mockProduct.setId("prod-1");
        mockProduct.setName("Rice Flour");
        mockProduct.setActive(true);

        ProductVariant variant = new ProductVariant("var-1", "250g", null, null, 10, true);
        mockProduct.setVariants(List.of(variant));

        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));

        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", "var-1", 2)),
                validAddress
        );

        InvalidOrderException ex = assertThrows(InvalidOrderException.class, () ->
                orderService.createOrder("user-123", request));
        assertTrue(ex.getMessage().contains("price for 'Rice Flour' (250g) is not configured yet"));
    }

    @Test
    void createOrder_shouldCalculatePriceServerSideAndPersist() throws Exception {
        Product mockProduct = new Product();
        mockProduct.setId("prod-1");
        mockProduct.setName("Rice Flour");
        mockProduct.setActive(true);

        ProductVariant variant = new ProductVariant("var-1", "500g", 80.0, 90.0, 20, true);
        mockProduct.setVariants(List.of(variant));

        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId("ord-generated-123");
            return o;
        });

        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", "var-1", 3)),
                validAddress
        );

        Order saved = orderService.createOrder("user-test-uid", request);

        assertNotNull(saved);
        assertEquals("ord-generated-123", saved.getId());
        assertEquals("user-test-uid", saved.getUserId());
        assertEquals(240.0, saved.getSubtotal()); // 80.0 * 3
        assertEquals(240.0, saved.getTotal());
        assertNull(saved.getDeliveryFee());
        assertEquals("COD", saved.getPaymentMethod());
        assertEquals("PENDING", saved.getPaymentStatus());
        assertEquals("CREATED", saved.getOrderStatus());
        assertEquals(1, saved.getItems().size());
        assertEquals(80.0, saved.getItems().get(0).getPrice());
        assertEquals(240.0, saved.getItems().get(0).getSubtotal());
    }

    @Test
    void createOrder_shouldSetPaymentMethodFromRequest() throws Exception {
        Product mockProduct = new Product();
        mockProduct.setId("prod-1");
        mockProduct.setName("Rice Flour");
        mockProduct.setActive(true);

        ProductVariant variant = new ProductVariant("var-1", "500g", 80.0, 90.0, 10, true);
        mockProduct.setVariants(List.of(variant));

        when(productRepository.findById("prod-1")).thenReturn(Optional.of(mockProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-1", "var-1", 1)),
                validAddress,
                "COD"
        );

        Order saved = orderService.createOrder("user-test-uid", request);
        assertEquals("COD", saved.getPaymentMethod());
        assertEquals("PENDING", saved.getPaymentStatus());
    }

    @Test
    void getOrderById_shouldRejectAccessForDifferentUser() throws Exception {
        Order mockOrder = new Order();
        mockOrder.setId("ord-1");
        mockOrder.setUserId("user-owner");

        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(mockOrder));

        assertThrows(ForbiddenException.class, () ->
                orderService.getOrderById("ord-1", "user-different"));
    }

    @Test
    void getOrderById_shouldThrowNotFoundIfMissing() throws Exception {
        when(orderRepository.findById("ord-missing")).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class, () ->
                orderService.getOrderById("ord-missing", "user-123"));
    }
}
