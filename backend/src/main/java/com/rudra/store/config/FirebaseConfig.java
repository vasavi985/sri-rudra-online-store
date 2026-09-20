package com.rudra.store.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials.path:credentials/rudra-online-store-firebase-adminsdk-fbsvc-05ae01e5f0.json}")
    private String credentialsPath;

    @PostConstruct
    public void initializeFirebase() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            for (FirebaseApp app : new java.util.ArrayList<>(FirebaseApp.getApps())) {
                try {
                    app.delete();
                } catch (Exception e) {
                    logger.warn("Error resetting existing FirebaseApp: {}", e.getMessage());
                }
            }
        }
        GoogleCredentials credentials = loadCredentials();
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();
        FirebaseApp.initializeApp(options);
        logger.info("FirebaseApp initialized successfully.");
    }

    @jakarta.annotation.PreDestroy
    public void cleanupFirebase() {
        if (!FirebaseApp.getApps().isEmpty()) {
            for (FirebaseApp app : new java.util.ArrayList<>(FirebaseApp.getApps())) {
                try {
                    app.delete();
                } catch (Exception e) {
                    logger.warn("Error deleting FirebaseApp on shutdown: {}", e.getMessage());
                }
            }
        }
    }

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            initializeFirebase();
        }
        return FirebaseApp.getInstance();
    }

    @Bean(name = {"firestore", "firebaseFirestore"})
    public Firestore firestore() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            initializeFirebase();
        }
        return FirestoreClient.getFirestore();
    }

    @Bean
    public com.google.firebase.auth.FirebaseAuth firebaseAuth() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            initializeFirebase();
        }
        return com.google.firebase.auth.FirebaseAuth.getInstance();
    }

    private GoogleCredentials loadCredentials() throws IOException {
        File file = new File(credentialsPath);
        if (!file.exists()) {
            File backendFile = new File("backend", credentialsPath);
            if (backendFile.exists()) {
                file = backendFile;
            }
        }

        if (file.exists()) {
            logger.info("Loading Firebase credentials from file: {}", file.getAbsolutePath());
            try (InputStream stream = new FileInputStream(file)) {
                return GoogleCredentials.fromStream(stream);
            }
        }

        InputStream resourceStream = getClass().getClassLoader().getResourceAsStream(credentialsPath);
        if (resourceStream != null) {
            logger.info("Loading Firebase credentials from classpath: {}", credentialsPath);
            try (resourceStream) {
                return GoogleCredentials.fromStream(resourceStream);
            }
        }

        throw new FileNotFoundException("Firebase credentials file not found at: " + file.getAbsolutePath());
    }
}
