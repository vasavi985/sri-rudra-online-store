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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private FirebaseAuthService firebaseAuthService;

    @Mock
    private AdminService adminService;

    @Mock
    private ProductService productService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private AdminController adminController;

    private static final String VALID_SECRET = "test-secret-12345";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adminController, "adminSetupSecret", VALID_SECRET);
    }

    @Test
    void checkAdminStatus_shouldSucceedWhenAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer valid-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("admin-uid");
        when(firebaseToken.getEmail()).thenReturn("admin@test.com");
        when(firebaseToken.getName()).thenReturn("Admin User");

        ResponseEntity<Map<String, Object>> response = adminController.checkAdminStatus("Bearer valid-token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("admin"));
        assertEquals("admin-uid", response.getBody().get("uid"));
        assertEquals("admin@test.com", response.getBody().get("email"));
    }

    @Test
    void checkAdminStatus_shouldThrowWhenNonAdmin() {
        when(firebaseAuthService.verifyAdmin("Bearer customer-token"))
                .thenThrow(new ForbiddenException("Access denied: Administrator privileges required"));

        assertThrows(ForbiddenException.class, () ->
                adminController.checkAdminStatus("Bearer customer-token"));
    }

    @Test
    void setupAdmin_shouldFailSafelyWhenServerSecretIsEmpty() {
        ReflectionTestUtils.setField(adminController, "adminSetupSecret", "");
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret("any-secret-value");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                adminController.setupAdmin("Bearer any-token", req));
        assertTrue(ex.getMessage().contains("ADMIN_SETUP_SECRET is not configured"));
    }

    @Test
    void setupAdmin_shouldFailSafelyWhenServerSecretIsNull() {
        ReflectionTestUtils.setField(adminController, "adminSetupSecret", null);
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret("any-secret-value");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                adminController.setupAdmin("Bearer any-token", req));
        assertTrue(ex.getMessage().contains("ADMIN_SETUP_SECRET is not configured"));
    }

    @Test
    void setupAdmin_shouldThrowUnauthorizedWhenSecretIsNull() {
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret(null);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                adminController.setupAdmin("Bearer any-token", req));
        assertTrue(ex.getMessage().contains("Admin setup secret is required"));
    }

    @Test
    void setupAdmin_shouldThrowUnauthorizedWhenSecretIsEmpty() {
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret("   ");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                adminController.setupAdmin("Bearer any-token", req));
        assertTrue(ex.getMessage().contains("Admin setup secret is required"));
    }

    @Test
    void setupAdmin_shouldThrowForbiddenWhenSecretIsInvalid() {
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret("wrong-secret-key");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                adminController.setupAdmin("Bearer any-token", req));
        assertEquals("Invalid admin setup secret", ex.getMessage());
    }

    @Test
    void setupAdmin_shouldSucceedWhenSecretMatches() throws Exception {
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret(VALID_SECRET);

        when(firebaseAuthService.verifyToken("Bearer token-abc")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("user-promoted-uid");
        when(firebaseToken.getEmail()).thenReturn("promoted@example.com");

        ResponseEntity<Map<String, Object>> response = adminController.setupAdmin("Bearer token-abc", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("success"));
        assertEquals("user-promoted-uid", response.getBody().get("uid"));

        verify(firebaseAuthService).promoteUserToAdmin("user-promoted-uid");
    }

    @Test
    void setupAdmin_shouldRejectWhenEmailDoesNotMatchConfiguredAdminEmail() {
        adminController.setAdminEmailConfig("srirudra28@gmail.com");
        AdminSetupRequest req = new AdminSetupRequest();
        req.setSetupSecret(VALID_SECRET);

        when(firebaseAuthService.verifyToken("Bearer token-other")).thenReturn(firebaseToken);
        when(firebaseToken.getEmail()).thenReturn("hacker@example.com");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                adminController.setupAdmin("Bearer token-other", req));
        assertTrue(ex.getMessage().contains("Admin setup is restricted"));

        // Reset config
        adminController.setAdminEmailConfig("");
    }

    @Test
    void getAdminStats_shouldVerifyAdminAndReturnStats() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-tok")).thenReturn(firebaseToken);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", 15L);
        when(adminService.getOverviewStats()).thenReturn(stats);

        ResponseEntity<Map<String, Object>> response = adminController.getAdminStats("Bearer admin-tok");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(15L, response.getBody().get("totalOrders"));
        verify(firebaseAuthService).verifyAdmin("Bearer admin-tok");
    }

    @Test
    void getAdminOrders_shouldVerifyAdminAndReturnOrders() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-tok")).thenReturn(firebaseToken);
        Order order = new Order();
        order.setId("ord-101");
        when(adminService.getAllOrders("CONFIRMED")).thenReturn(List.of(order));

        ResponseEntity<List<Order>> response = adminController.getAdminOrders("Bearer admin-tok", "CONFIRMED");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("ord-101", response.getBody().get(0).getId());
    }

    @Test
    void patchOrderStatus_shouldVerifyAdminAndUpdate() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-tok")).thenReturn(firebaseToken);
        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setOrderStatus("SHIPPED");
        req.setDeliveryFee(35.0);

        Order updated = new Order();
        updated.setId("ord-101");
        updated.setOrderStatus("SHIPPED");
        updated.setDeliveryFee(35.0);

        when(adminService.updateOrderStatus("ord-101", req)).thenReturn(updated);

        ResponseEntity<Order> response = adminController.patchOrderStatus("Bearer admin-tok", "ord-101", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("SHIPPED", response.getBody().getOrderStatus());
        assertEquals(35.0, response.getBody().getDeliveryFee());
    }

    @Test
    void getAdminProducts_shouldVerifyAdminAndReturnAll() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-tok")).thenReturn(firebaseToken);
        Product p = new Product();
        p.setId("p-1");
        when(productService.getAllProducts()).thenReturn(List.of(p));

        ResponseEntity<List<Product>> response = adminController.getAdminProducts("Bearer admin-tok");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void getAdminCategories_shouldVerifyAdminAndReturnAll() {
        when(firebaseAuthService.verifyAdmin("Bearer admin-tok")).thenReturn(firebaseToken);
        Category c = new Category();
        c.setId("c-1");
        when(categoryService.getAllCategories()).thenReturn(List.of(c));

        ResponseEntity<List<Category>> response = adminController.getAdminCategories("Bearer admin-tok");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }
}
