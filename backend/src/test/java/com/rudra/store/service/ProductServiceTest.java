package com.rudra.store.service;

import com.google.cloud.firestore.Firestore;
import com.rudra.store.model.Product;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private Firestore firestore;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setId("prod-123");
        testProduct.setName("Test Spice");
        testProduct.setActive(true);
    }

    @Test
    void hardDeleteProduct_shouldThrowException_whenProductHasExistingOrders() throws Exception {
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));
        when(orderRepository.hasOrdersForProduct("prod-123")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                productService.hardDeleteProduct("prod-123"));

        assertEquals("This product is linked to an existing order and cannot be permanently deleted. Deactivate it instead.", ex.getMessage());
        verify(productRepository, never()).deleteById("prod-123");
    }

    @Test
    void hardDeleteProduct_shouldDeleteSuccessfully_whenProductHasNoOrders() throws Exception {
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));
        when(orderRepository.hasOrdersForProduct("prod-123")).thenReturn(false);

        assertDoesNotThrow(() -> productService.hardDeleteProduct("prod-123"));

        verify(productRepository).deleteById("prod-123");
    }

    @Test
    void deactivateProduct_shouldSetActiveFalse() throws Exception {
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(testProduct));

        productService.deactivateProduct("prod-123");

        assertFalse(testProduct.isActive());
        verify(productRepository).save(testProduct);
    }
}
