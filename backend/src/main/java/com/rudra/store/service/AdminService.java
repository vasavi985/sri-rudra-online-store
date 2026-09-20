package com.rudra.store.service;

import com.rudra.store.dto.UpdateOrderStatusRequest;
import com.rudra.store.exception.InvalidOrderException;
import com.rudra.store.exception.OrderNotFoundException;
import com.rudra.store.model.Order;
import com.rudra.store.model.Product;
import com.rudra.store.model.ProductVariant;
import com.rudra.store.repository.CategoryRepository;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private static final Set<String> VALID_ORDER_STATUSES = new HashSet<>(Arrays.asList(
            "CREATED", "RECEIVED", "CONFIRMED", "PROCESSING", "PACKAGING", "SHIPPED", "DISPATCHED", "DELIVERED", "CANCELLED"
    ));

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public AdminService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        CategoryRepository categoryRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Aggregates store-wide key performance indicators for the admin dashboard.
     */
    public Map<String, Object> getOverviewStats() {
        try {
            List<Order> orders = orderRepository.findAll();
            List<Product> products = productRepository.findAll();

            long totalOrders = orders.size();
            long pendingOrders = 0;
            long confirmedOrders = 0;
            long shippedOrders = 0;
            long deliveredOrders = 0;
            double totalRevenue = 0.0;

            for (Order o : orders) {
                String status = o.getOrderStatus() != null ? o.getOrderStatus().toUpperCase() : "CREATED";
                if ("CREATED".equals(status) || "RECEIVED".equals(status)) {
                    pendingOrders++;
                } else if ("CONFIRMED".equals(status) || "PROCESSING".equals(status) || "PACKAGING".equals(status)) {
                    confirmedOrders++;
                } else if ("SHIPPED".equals(status) || "DISPATCHED".equals(status)) {
                    shippedOrders++;
                } else if ("DELIVERED".equals(status)) {
                    deliveredOrders++;
                }

                if (!"CANCELLED".equals(status) && o.getTotal() != null) {
                    totalRevenue += o.getTotal();
                }
            }

            long totalProducts = products.size();
            long activeProducts = 0;
            long lowStockCount = 0;
            long unpricedCount = 0;

            for (Product p : products) {
                if (p.isActive()) {
                    activeProducts++;
                }
                if (p.getVariants() != null) {
                    for (ProductVariant v : p.getVariants()) {
                        if (v.isActive()) {
                            if (v.getStock() != null && v.getStock() <= 5) {
                                lowStockCount++;
                            }
                            if (v.getPrice() == null || v.getPrice() <= 0) {
                                unpricedCount++;
                            }
                        }
                    }
                }
            }

            long totalCategories = categoryRepository.findAll().size();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRevenue", totalRevenue);
            stats.put("totalOrders", totalOrders);
            stats.put("pendingOrders", pendingOrders);
            stats.put("confirmedOrders", confirmedOrders);
            stats.put("shippedOrders", shippedOrders);
            stats.put("deliveredOrders", deliveredOrders);
            stats.put("totalProducts", totalProducts);
            stats.put("activeProducts", activeProducts);
            stats.put("inactiveProducts", totalProducts - activeProducts);
            stats.put("lowStockCount", lowStockCount);
            stats.put("unpricedCount", unpricedCount);
            stats.put("totalCategories", totalCategories);

            return stats;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while compiling dashboard stats", e);
        } catch (ExecutionException e) {
            logger.error("Failed to compile dashboard stats: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to aggregate dashboard metrics", e);
        }
    }

    /**
     * Retrieves all orders across the platform, optionally filtered by status.
     */
    public List<Order> getAllOrders(String statusFilter) {
        try {
            List<Order> allOrders = orderRepository.findAll();
            if (statusFilter == null || statusFilter.trim().isEmpty() || "ALL".equalsIgnoreCase(statusFilter.trim())) {
                return allOrders;
            }
            String filter = statusFilter.trim().toUpperCase();
            return allOrders.stream()
                    .filter(o -> o.getOrderStatus() != null && o.getOrderStatus().equalsIgnoreCase(filter))
                    .collect(Collectors.toList());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching orders", e);
        } catch (ExecutionException e) {
            logger.error("Failed to fetch orders: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to query order records", e);
        }
    }

    /**
     * Retrieves a single order by ID for admin review.
     */
    public Order getOrderById(String orderId) {
        if (orderId == null || orderId.trim().isEmpty()) {
            throw new InvalidOrderException("Order ID is required");
        }
        try {
            return orderRepository.findById(orderId.trim())
                    .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + orderId));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while retrieving order", e);
        } catch (ExecutionException e) {
            logger.error("Failed to retrieve order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve order record", e);
        }
    }

    /**
     * Updates an order's status and assigns or confirms the delivery fee.
     */
    public Order updateOrderStatus(String orderId, UpdateOrderStatusRequest request) {
        if (orderId == null || orderId.trim().isEmpty()) {
            throw new InvalidOrderException("Order ID is required");
        }
        if (request == null) {
            throw new InvalidOrderException("Order update request cannot be empty");
        }

        Order order = getOrderById(orderId);

        // Update status if provided
        if (request.getOrderStatus() != null && !request.getOrderStatus().trim().isEmpty()) {
            String newStatus = request.getOrderStatus().trim().toUpperCase();
            if (!VALID_ORDER_STATUSES.contains(newStatus)) {
                throw new InvalidOrderException("Invalid order status: " + newStatus +
                        ". Valid statuses are: " + VALID_ORDER_STATUSES);
            }
            order.setOrderStatus(newStatus);
        }

        // Update delivery fee if provided
        if (request.getDeliveryFee() != null) {
            if (request.getDeliveryFee() < 0) {
                throw new InvalidOrderException("Delivery fee cannot be negative");
            }
            order.setDeliveryFee(request.getDeliveryFee());
            double subtotal = order.getSubtotal() != null ? order.getSubtotal() : 0.0;
            order.setTotal(subtotal + request.getDeliveryFee());
        }

        order.setUpdatedAt(System.currentTimeMillis());

        try {
            Order saved = orderRepository.save(order);
            logger.info("Admin updated order {} to status: {} with deliveryFee: {}",
                    saved.getId(), saved.getOrderStatus(), saved.getDeliveryFee());
            return saved;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while updating order status", e);
        } catch (ExecutionException e) {
            logger.error("Failed to save updated order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to update order in database", e);
        }
    }
}
