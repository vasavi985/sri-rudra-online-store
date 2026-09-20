package com.rudra.store.controller;

import com.google.firebase.auth.FirebaseToken;
import com.rudra.store.dto.AdminSetupRequest;
import com.rudra.store.dto.UpdateOrderStatusRequest;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.exception.UnauthorizedException;
import com.rudra.store.model.Category;
import com.rudra.store.model.Order;
import com.rudra.store.model.Product;
import com.rudra.store.service.AdminService;
import com.rudra.store.service.CategoryService;
import com.rudra.store.service.FirebaseAuthService;
import com.rudra.store.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final FirebaseAuthService firebaseAuthService;
    private final AdminService adminService;
    private final ProductService productService;
    private final CategoryService categoryService;

    @Value("${admin.setup.secret:}")
    private String adminSetupSecret;

    @Value("${admin.email:}")
    private String adminEmailConfig = "";

    public AdminController(FirebaseAuthService firebaseAuthService,
                           AdminService adminService,
                           ProductService productService,
                           CategoryService categoryService) {
        this.firebaseAuthService = firebaseAuthService;
        this.adminService = adminService;
        this.productService = productService;
        this.categoryService = categoryService;
    }

    /**
     * Verifies if the current caller has active administrator privileges.
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkAdminStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        FirebaseToken token = firebaseAuthService.verifyAdmin(authHeader);
        Map<String, Object> response = new HashMap<>();
        response.put("admin", true);
        response.put("uid", token.getUid());
        response.put("email", token.getEmail());
        response.put("name", token.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * One-time setup mechanism: Promotes the currently authenticated user
     * to Administrator upon providing the correct setup secret and matching ADMIN_EMAIL (if configured).
     */
    @PostMapping("/setup")
    public ResponseEntity<Map<String, Object>> setupAdmin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody AdminSetupRequest request) {
        if (adminSetupSecret == null || adminSetupSecret.trim().isEmpty()) {
            logger.warn("Security Alert: Admin setup attempted but ADMIN_SETUP_SECRET is not configured on this server");
            throw new ForbiddenException("Admin setup is disabled. ADMIN_SETUP_SECRET is not configured on the server.");
        }

        if (request == null || request.getSetupSecret() == null || request.getSetupSecret().trim().isEmpty()) {
            throw new UnauthorizedException("Admin setup secret is required");
        }

        if (!adminSetupSecret.trim().equals(request.getSetupSecret().trim())) {
            logger.warn("Security Alert: Failed admin setup attempt with invalid secret");
            throw new ForbiddenException("Invalid admin setup secret");
        }

        FirebaseToken token = firebaseAuthService.verifyToken(authHeader);

        // If ADMIN_EMAIL is configured, restrict setup exclusively to that email
        if (adminEmailConfig != null && !adminEmailConfig.trim().isEmpty()) {
            if (token.getEmail() == null || !adminEmailConfig.trim().equalsIgnoreCase(token.getEmail().trim())) {
                logger.warn("Security Alert: User {} attempted admin setup, but does not match configured ADMIN_EMAIL '{}'",
                        token.getEmail(), adminEmailConfig.trim());
                throw new ForbiddenException("Admin setup is restricted to the designated administrator account.");
            }
        }

        try {
            firebaseAuthService.promoteUserToAdmin(token.getUid());
            logger.info("Admin setup completed: Promoted user UID {} (email: {}) to Administrator",
                    token.getUid(), token.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Administrator privileges successfully granted. Please refresh your session.");
            response.put("uid", token.getUid());
            response.put("email", token.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to promote user {} to admin: {}", token.getUid(), e.getMessage(), e);
            throw new RuntimeException("Failed to grant administrator privileges: " + e.getMessage(), e);
        }
    }

    public void setAdminEmailConfig(String adminEmailConfig) {
        this.adminEmailConfig = adminEmailConfig;
    }

    /**
     * Returns KPI metrics and overview stats for the Admin Dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        firebaseAuthService.verifyAdmin(authHeader);
        Map<String, Object> stats = adminService.getOverviewStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Returns all customer orders across the platform with optional status filtering.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAdminOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String status) {
        firebaseAuthService.verifyAdmin(authHeader);
        List<Order> orders = adminService.getAllOrders(status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Retrieves full details for a single order by ID.
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getAdminOrderById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        firebaseAuthService.verifyAdmin(authHeader);
        Order order = adminService.getOrderById(id);
        return ResponseEntity.ok(order);
    }

    /**
     * Updates an order's status and configures delivery charges.
     */
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<Order> patchOrderStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody UpdateOrderStatusRequest request) {
        firebaseAuthService.verifyAdmin(authHeader);
        Order updated = adminService.updateOrderStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> putOrderStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody UpdateOrderStatusRequest request) {
        return patchOrderStatus(authHeader, id, request);
    }

    /**
     * Returns all products including inactive ones for administrative management.
     */
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAdminProducts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        firebaseAuthService.verifyAdmin(authHeader);
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Returns all categories including inactive ones for administrative management.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAdminCategories(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        firebaseAuthService.verifyAdmin(authHeader);
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
}

