package com.rudra.store.service;

import com.google.cloud.firestore.Firestore;
import com.rudra.store.exception.ProductNotFoundException;
import com.rudra.store.model.Product;
import com.rudra.store.model.ProductVariant;
import com.rudra.store.repository.OrderRepository;
import com.rudra.store.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final Firestore firestore;
    private final OrderRepository orderRepository;

    public ProductService(ProductRepository productRepository, Firestore firestore) {
        this(productRepository, firestore, null);
    }

    @Autowired
    public ProductService(ProductRepository productRepository, Firestore firestore, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.firestore = firestore;
        this.orderRepository = orderRepository;
    }

    public List<Product> getAllActiveProducts() {
        try {
            List<Product> products = productRepository.findAllActive();
            java.util.List<Product> activeProducts = new java.util.ArrayList<>();
            for (Product product : products) {
                if (product.isActive()) {
                    if (product.getVariants() != null) {
                        java.util.List<ProductVariant> activeVariants = product.getVariants().stream()
                                .filter(ProductVariant::isActive)
                                .toList();
                        product.setVariants(new java.util.ArrayList<>(activeVariants));
                    }
                    activeProducts.add(product);
                }
            }
            return activeProducts;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching active products", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch active products from Firestore", e);
        }
    }


    public List<Product> getAllProducts() {
        try {
            return productRepository.findAll();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching all products", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch products from Firestore", e);
        }
    }


    public Product getProductById(String id) {
        try {
            return productRepository.findById(id)
                    .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while fetching product with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to fetch product from Firestore with id: " + id, e);
        }
    }

    public Product createProduct(Product product) {
        try {
            long now = System.currentTimeMillis();
            product.setCreatedAt(now);
            product.setUpdatedAt(now);

            // Sync single imageUrl and multiple imageUrls list
            if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
                if (product.getImageUrl() == null || product.getImageUrl().trim().isEmpty()) {
                    product.setImageUrl(product.getImageUrls().get(0));
                }
            } else if (product.getImageUrl() != null && !product.getImageUrl().trim().isEmpty()) {
                java.util.List<String> list = new java.util.ArrayList<>();
                list.add(product.getImageUrl().trim());
                product.setImageUrls(list);
            }

            if (product.getVariants() != null) {
                for (ProductVariant variant : product.getVariants()) {
                    if (variant.getVariantId() == null || variant.getVariantId().trim().isEmpty()) {
                        variant.setVariantId(UUID.randomUUID().toString());
                    }
                }
            }

            Product savedProduct = productRepository.save(product);
            logger.info("Product created successfully with id: {}", savedProduct.getId());
            return savedProduct;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while creating product", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to create product in Firestore", e);
        }
    }

    public Product updateProduct(String id, Product updatedProduct) {
        try {
            Product existingProduct = getProductById(id);

            existingProduct.setName(updatedProduct.getName());
            existingProduct.setDescription(updatedProduct.getDescription());
            existingProduct.setCategoryId(updatedProduct.getCategoryId());

            // Sync single and multiple image URLs
            if (updatedProduct.getImageUrls() != null && !updatedProduct.getImageUrls().isEmpty()) {
                existingProduct.setImageUrls(updatedProduct.getImageUrls());
                existingProduct.setImageUrl(updatedProduct.getImageUrls().get(0));
            } else if (updatedProduct.getImageUrl() != null && !updatedProduct.getImageUrl().trim().isEmpty()) {
                existingProduct.setImageUrl(updatedProduct.getImageUrl().trim());
                java.util.List<String> list = new java.util.ArrayList<>();
                list.add(updatedProduct.getImageUrl().trim());
                existingProduct.setImageUrls(list);
            } else {
                existingProduct.setImageUrl("");
                existingProduct.setImageUrls(new java.util.ArrayList<>());
            }

            existingProduct.setActive(updatedProduct.isActive());

            if (updatedProduct.getVariants() != null) {
                for (ProductVariant variant : updatedProduct.getVariants()) {
                    if (variant.getVariantId() == null || variant.getVariantId().trim().isEmpty()) {
                        variant.setVariantId(UUID.randomUUID().toString());
                    }
                }
                existingProduct.setVariants(updatedProduct.getVariants());
            }

            existingProduct.setUpdatedAt(System.currentTimeMillis());

            Product saved = productRepository.save(existingProduct);
            logger.info("Product updated successfully with id: {}", saved.getId());
            return saved;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while updating product with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to update product in Firestore with id: " + id, e);
        }
    }

    public void deactivateProduct(String id) {
        try {
            Product existingProduct = getProductById(id);
            existingProduct.setActive(false);
            existingProduct.setUpdatedAt(System.currentTimeMillis());
            productRepository.save(existingProduct);
            logger.info("Product deactivated with id: {}", id);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while deactivating product with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to deactivate product in Firestore with id: " + id, e);
        }
    }

    public void deleteProduct(String id) {
        deactivateProduct(id);
    }

    public void hardDeleteProduct(String id) {
        try {
            getProductById(id);
            if (orderRepository != null && orderRepository.hasOrdersForProduct(id)) {
                logger.warn("Cannot permanently delete product {} because it is referenced in an existing order", id);
                throw new IllegalArgumentException("This product is linked to an existing order and cannot be permanently deleted. Deactivate it instead.");
            }
            productRepository.deleteById(id);
            logger.info("Product permanently deleted with id: {}", id);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while deleting product with id: " + id, e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to delete product in Firestore with id: " + id, e);
        }
    }
}
