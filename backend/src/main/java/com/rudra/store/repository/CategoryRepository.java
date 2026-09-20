package com.rudra.store.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.rudra.store.model.Category;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class CategoryRepository {

    public static final String COLLECTION_NAME = "categories";

    private final Firestore firestore;

    public CategoryRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public CollectionReference getCollection() {
        return firestore.collection(COLLECTION_NAME);
    }

    public List<Category> findAllActive() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getCollection()
                .whereEqualTo("active", true)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Category> categories = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Category category = document.toObject(Category.class);
            if (category != null) {
                if (category.getId() == null || category.getId().trim().isEmpty()) {
                    category.setId(document.getId());
                }
                categories.add(category);
            }
        }
        return categories;
    }

    public List<Category> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getCollection().get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Category> categories = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Category category = document.toObject(Category.class);
            if (category != null) {
                if (category.getId() == null || category.getId().trim().isEmpty()) {
                    category.setId(document.getId());
                }
                categories.add(category);
            }
        }
        return categories;
    }

    public Optional<Category> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getCollection().document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            Category category = document.toObject(Category.class);
            if (category != null) {
                if (category.getId() == null || category.getId().trim().isEmpty()) {
                    category.setId(document.getId());
                }
                return Optional.of(category);
            }
        }
        return Optional.empty();
    }

    public Category save(Category category) throws ExecutionException, InterruptedException {
        DocumentReference docRef;
        if (category.getId() == null || category.getId().trim().isEmpty()) {
            docRef = getCollection().document();
            category.setId(docRef.getId());
        } else {
            docRef = getCollection().document(category.getId());
        }
        docRef.set(category).get();
        return category;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        getCollection().document(id).delete().get();
    }
}
