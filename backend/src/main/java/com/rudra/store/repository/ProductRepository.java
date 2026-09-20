package com.rudra.store.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.rudra.store.model.Product;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class ProductRepository {

    public static final String COLLECTION_NAME = "products";

    private final Firestore firestore;

    public ProductRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public CollectionReference getCollection() {
        return firestore.collection(COLLECTION_NAME);
    }

    public List<Product> findAllActive() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getCollection()
                .whereEqualTo("active", true)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Product> products = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Product product = document.toObject(Product.class);
            if (product != null) {
                if (product.getId() == null || product.getId().trim().isEmpty()) {
                    product.setId(document.getId());
                }
                products.add(product);
            }
        }
        return products;
    }

    public List<Product> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getCollection().get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Product> products = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Product product = document.toObject(Product.class);
            if (product != null) {
                if (product.getId() == null || product.getId().trim().isEmpty()) {
                    product.setId(document.getId());
                }
                products.add(product);
            }
        }
        return products;
    }

    public Optional<Product> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getCollection().document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            Product product = document.toObject(Product.class);
            if (product != null) {
                if (product.getId() == null || product.getId().trim().isEmpty()) {
                    product.setId(document.getId());
                }
                return Optional.of(product);
            }
        }
        return Optional.empty();
    }

    public Product save(Product product) throws ExecutionException, InterruptedException {
        DocumentReference docRef;
        if (product.getId() == null || product.getId().trim().isEmpty()) {
            docRef = getCollection().document();
            product.setId(docRef.getId());
        } else {
            docRef = getCollection().document(product.getId());
        }
        docRef.set(product).get();
        return product;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        getCollection().document(id).delete().get();
    }
}
