package com.rudra.store.service;

import com.rudra.store.dto.CreateOrderRequest;
import com.rudra.store.dto.OrderItemRequest;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.exception.InvalidOrderException;
import com.rudra.store.exception.OrderNotFoundException;
import com.rudra.store.model.Address;
import com.rudra.store.model.Order;
import com.rudra.store.model.OrderItem;
import com.rudra.store.model.Product;
import com.rudra.store.model.ProductVariant;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private static final Pattern INDIAN_MOBILE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern INDIAN_PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    /**
     * Creates and persists a customer order with complete server-side price calculation
     * and verification against Firestore product records.
     */
    public Order createOrder(String authenticatedUid, CreateOrderRequest request) {
        if (authenticatedUid == null || authenticatedUid.trim().isEmpty()) {
            throw new InvalidOrderException("Authenticated customer UID is required");
        }

        if (request == null) {
            throw new InvalidOrderException("Order request payload cannot be empty");
        }

        // 1. Validate Delivery Address
        validateAddress(request.getAddress());

        // 2. Validate Items Presence
        List<OrderItemRequest> itemRequests = request.getItems();
        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new InvalidOrderException("Order must contain at least one item");
        }

        // 3. Process each item against current Firestore product & variant data
        List<OrderItem> verifiedItems = new ArrayList<>();
        double calculatedSubtotal = 0.0;

        for (OrderItemRequest reqItem : itemRequests) {
            if (reqItem.getProductId() == null || reqItem.getProductId().trim().isEmpty()) {
                throw new InvalidOrderException("Product ID is required for each cart item");
            }
            if (reqItem.getVariantId() == null || reqItem.getVariantId().trim().isEmpty()) {
                throw new InvalidOrderException("Variant ID is required for each cart item");
            }
            int qty = reqItem.getQuantity() != null ? reqItem.getQuantity() : 0;
            if (qty < 1) {
                throw new InvalidOrderException("Item quantity must be at least 1");
            }

            // Retrieve current product from Firestore
            Product product;
            try {
                product = productRepository.findById(reqItem.getProductId().trim())
                        .orElseThrow(() -> new InvalidOrderException("Product not found with ID: " + reqItem.getProductId()));
            } catch (InvalidOrderException e) {
                throw e;
            } catch (Exception e) {
                logger.error("Error retrieving product {} during order creation: {}", reqItem.getProductId(), e.getMessage());
                throw new RuntimeException("Failed to verify product availability", e);
            }

            if (!product.isActive()) {
                throw new InvalidOrderException("Product '" + product.getName() + "' is currently unavailable");
            }

            // Match variant
            ProductVariant matchedVariant = null;
            if (product.getVariants() != null) {
                for (ProductVariant v : product.getVariants()) {
                    if (reqItem.getVariantId().trim().equals(v.getVariantId())) {
                        matchedVariant = v;
                        break;
                    }
                }
            }

            if (matchedVariant == null) {
                throw new InvalidOrderException("Variant not found for product '" + product.getName() + "': " + reqItem.getVariantId());
            }

            if (!matchedVariant.isActive()) {
                throw new InvalidOrderException("Product variant (" + matchedVariant.getWeight() + ") for '" + product.getName() + "' is currently inactive");
            }

            // Price validation - strictly reject missing or unconfigured prices
            Double variantPrice = matchedVariant.getPrice();
            if (variantPrice == null || variantPrice <= 0.0) {
                throw new InvalidOrderException("Product price for '" + product.getName() + "' (" + matchedVariant.getWeight() + ") is not configured yet. Orders cannot be placed.");
            }

            double lineSubtotal = variantPrice * qty;
            calculatedSubtotal += lineSubtotal;

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setVariantId(matchedVariant.getVariantId());
            orderItem.setWeight(matchedVariant.getWeight());
            orderItem.setQuantity(qty);
            orderItem.setPrice(variantPrice);
            orderItem.setSubtotal(lineSubtotal);

            verifiedItems.add(orderItem);
        }

        // 4. Construct Order entity
        long serverTime = System.currentTimeMillis();

        Order order = new Order();
        order.setUserId(authenticatedUid);
        order.setItems(verifiedItems);
        order.setSubtotal(calculatedSubtotal);
        // Delivery fee is pending business configuration - never invent a fee
        order.setDeliveryFee(null);
        // Total set to items subtotal pending delivery confirmation
        order.setTotal(calculatedSubtotal);
        order.setAddress(cleanAddress(request.getAddress()));
        String paymentMethod = (request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty())
                ? request.getPaymentMethod().trim().toUpperCase()
                : "COD";
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("PENDING");
        order.setOrderStatus("CREATED");
        order.setRazorpayOrderId(null);
        order.setRazorpayPaymentId(null);
        order.setCreatedAt(serverTime);
        order.setUpdatedAt(serverTime);

        // 5. Save to Firestore
        try {
            Order savedOrder = orderRepository.save(order);
            logger.info("Order created successfully with ID: {} for user: {}", savedOrder.getId(), authenticatedUid);
            return savedOrder;
        } catch (Exception e) {
            logger.error("Failed to save order in Firestore: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to persist order in database", e);
        }
    }

    /**
     * Retrieves all orders placed by the authenticated customer.
     */
    public List<Order> getMyOrders(String authenticatedUid) {
        if (authenticatedUid == null || authenticatedUid.trim().isEmpty()) {
            throw new InvalidOrderException("Authenticated UID is required");
        }
        try {
            return orderRepository.findByUserId(authenticatedUid);
        } catch (Exception e) {
            logger.error("Failed to fetch orders for user {}: {}", authenticatedUid, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch customer orders", e);
        }
    }

    /**
     * Retrieves a single order by ID ensuring the customer owns the order.
     */
    public Order getOrderById(String orderId, String authenticatedUid) {
        if (orderId == null || orderId.trim().isEmpty()) {
            throw new InvalidOrderException("Order ID is required");
        }
        if (authenticatedUid == null || authenticatedUid.trim().isEmpty()) {
            throw new InvalidOrderException("Authenticated UID is required");
        }

        Order order;
        try {
            order = orderRepository.findById(orderId.trim())
                    .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + orderId));
        } catch (OrderNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to retrieve order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve order", e);
        }

        if (!authenticatedUid.equals(order.getUserId())) {
            logger.warn("Security violation: User {} attempted to access order {} belonging to user {}",
                    authenticatedUid, orderId, order.getUserId());
            throw new ForbiddenException("Access denied: You do not have permission to view this order");
        }

        return order;
    }

    private void validateAddress(Address address) {
        if (address == null) {
            throw new InvalidOrderException("Delivery address is required");
        }
        if (address.getFullName() == null || address.getFullName().trim().isEmpty()) {
            throw new InvalidOrderException("Full name is required in delivery address");
        }
        if (address.getMobileNumber() == null || !INDIAN_MOBILE_PATTERN.matcher(address.getMobileNumber().trim()).matches()) {
            throw new InvalidOrderException("A valid 10-digit Indian mobile number is required (starting with 6, 7, 8, or 9)");
        }
        if (address.getAddressLine1() == null || address.getAddressLine1().trim().isEmpty()) {
            throw new InvalidOrderException("Address Line 1 is required in delivery address");
        }
        if (address.getCity() == null || address.getCity().trim().isEmpty()) {
            throw new InvalidOrderException("City is required in delivery address");
        }
        if (address.getState() == null || address.getState().trim().isEmpty()) {
            throw new InvalidOrderException("State is required in delivery address");
        }
        if (address.getPincode() == null || !INDIAN_PINCODE_PATTERN.matcher(address.getPincode().trim()).matches()) {
            throw new InvalidOrderException("A valid 6-digit Indian postal pincode is required");
        }
    }

    private Address cleanAddress(Address raw) {
        Address clean = new Address();
        clean.setFullName(raw.getFullName().trim());
        clean.setMobileNumber(raw.getMobileNumber().trim());
        clean.setAddressLine1(raw.getAddressLine1().trim());
        clean.setAddressLine2(raw.getAddressLine2() != null && !raw.getAddressLine2().trim().isEmpty() ? raw.getAddressLine2().trim() : null);
        clean.setCity(raw.getCity().trim());
        clean.setState(raw.getState().trim());
        clean.setPincode(raw.getPincode().trim());
        return clean;
    }
}
