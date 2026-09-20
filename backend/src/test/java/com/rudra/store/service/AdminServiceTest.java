package com.rudra.store.service;

import com.rudra.store.dto.UpdateOrderStatusRequest;
import com.rudra.store.exception.InvalidOrderException;
import com.rudra.store.model.Category;
import com.rudra.store.model.Order;
import com.rudra.store.model.Product;
import com.rudra.store.model.ProductVariant;
import com.rudra.store.repository.CategoryRepository;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private AdminService adminService;

    private Order order1;
    private Order order2;
    private Product product1;

    @BeforeEach
    void setUp() {
        order1 = new Order();
        order1.setId("ord-1");
        order1.setOrderStatus("CREATED");
        order1.setSubtotal(500.0);
        order1.setTotal(500.0);

        order2 = new Order();
        order2.setId("ord-2");
        order2.setOrderStatus("DELIVERED");
        order2.setSubtotal(1000.0);
        order2.setDeliveryFee(50.0);
        order2.setTotal(1050.0);

        product1 = new Product();
        product1.setId("prod-1");
        product1.setActive(true);

        ProductVariant v1 = new ProductVariant("v1", "500g", 120.0, 150.0, 3, true);
        ProductVariant v2 = new ProductVariant("v2", "1kg", null, null, 10, true);
        product1.setVariants(Arrays.asList(v1, v2));
    }

    @Test
    void getOverviewStats_shouldCalculateMetricsAccurately() throws Exception {
        when(orderRepository.findAll()).thenReturn(Arrays.asList(order1, order2));
        when(productRepository.findAll()).thenReturn(List.of(product1));
        when(categoryRepository.findAll()).thenReturn(List.of(new Category()));

        Map<String, Object> stats = adminService.getOverviewStats();

        assertEquals(2L, stats.get("totalOrders"));
        assertEquals(1L, stats.get("pendingOrders"));
        assertEquals(1L, stats.get("deliveredOrders"));
        assertEquals(1550.0, stats.get("totalRevenue"));
        assertEquals(1L, stats.get("totalProducts"));
        assertEquals(1L, stats.get("activeProducts"));
        assertEquals(1L, stats.get("lowStockCount")); // v1 stock is 3 (<= 5)
        assertEquals(1L, stats.get("unpricedCount")); // v2 price is null
        assertEquals(1L, stats.get("totalCategories"));
    }

    @Test
    void getAllOrders_withStatusFilter_shouldFilterCorrectly() throws Exception {
        when(orderRepository.findAll()).thenReturn(Arrays.asList(order1, order2));

        List<Order> pending = adminService.getAllOrders("CREATED");
        assertEquals(1, pending.size());
        assertEquals("ord-1", pending.get(0).getId());

        List<Order> all = adminService.getAllOrders("ALL");
        assertEquals(2, all.size());
    }

    @Test
    void updateOrderStatus_shouldUpdateStatusAndRecalculateTotalWithDeliveryFee() throws Exception {
        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(order1));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("CONFIRMED", 40.0);
        Order updated = adminService.updateOrderStatus("ord-1", req);

        assertEquals("CONFIRMED", updated.getOrderStatus());
        assertEquals(40.0, updated.getDeliveryFee());
        assertEquals(540.0, updated.getTotal()); // 500 subtotal + 40 delivery fee
    }

    @Test
    void updateOrderStatus_withLifecycleStatuses_shouldUpdateSuccessfully() throws Exception {
        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(order1));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        for (String status : Arrays.asList("RECEIVED", "PACKAGING", "DISPATCHED", "DELIVERED")) {
            UpdateOrderStatusRequest req = new UpdateOrderStatusRequest(status, null);
            Order updated = adminService.updateOrderStatus("ord-1", req);
            assertEquals(status, updated.getOrderStatus());
        }
    }

    @Test
    void updateOrderStatus_withInvalidStatus_shouldThrow() throws Exception {
        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(order1));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest("BOGUS_STATUS", null);
        assertThrows(InvalidOrderException.class, () ->
                adminService.updateOrderStatus("ord-1", req));
    }
}
