package com.rudra.store.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.rudra.store.model.Order;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class OrderRepository {

    public static final String COLLECTION_NAME = "orders";
    private final Firestore firestore;

    public OrderRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public CollectionReference getCollection() {
        return firestore.collection(COLLECTION_NAME);
    }

    public Order save(Order order) throws ExecutionException, InterruptedException {
        DocumentReference docRef;
        if (order.getId() == null || order.getId().trim().isEmpty()) {
            docRef = getCollection().document();
            order.setId(docRef.getId());
        } else {
            docRef = getCollection().document(order.getId());
        }
        docRef.set(order).get();
        return order;
    }

    public Optional<Order> findById(String id) throws ExecutionException, InterruptedException {
        if (id == null || id.trim().isEmpty()) {
            return Optional.empty();
        }
        DocumentReference docRef = getCollection().document(id.trim());
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            Order order = document.toObject(Order.class);
            if (order != null) {
                if (order.getId() == null || order.getId().trim().isEmpty()) {
                    order.setId(document.getId());
                }
                return Optional.of(order);
            }
        }
        return Optional.empty();
    }

    public List<Order> findByUserId(String userId) throws ExecutionException, InterruptedException {
        if (userId == null || userId.trim().isEmpty()) {
            return new ArrayList<>();
        }
        ApiFuture<QuerySnapshot> future = getCollection()
                .whereEqualTo("userId", userId.trim())
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Order> orders = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Order order = document.toObject(Order.class);
            if (order != null) {
                if (order.getId() == null || order.getId().trim().isEmpty()) {
                    order.setId(document.getId());
                }
                orders.add(order);
            }
        }

        // Sort by createdAt descending (most recent first)
        orders.sort(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return orders;
    }

    public List<Order> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getCollection().get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Order> orders = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Order order = document.toObject(Order.class);
            if (order != null) {
                if (order.getId() == null || order.getId().trim().isEmpty()) {
                    order.setId(document.getId());
                }
                orders.add(order);
            }
        }

        // Sort by createdAt descending (most recent first)
        orders.sort(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return orders;
    }

    public boolean hasOrdersForProduct(String productId) throws ExecutionException, InterruptedException {
        if (productId == null || productId.trim().isEmpty()) {
            return false;
        }
        String cleanId = productId.trim();
        List<Order> orders = findAll();
        for (Order order : orders) {
            if (order.getItems() != null) {
                for (com.rudra.store.model.OrderItem item : order.getItems()) {
                    if (cleanId.equals(item.getProductId())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

