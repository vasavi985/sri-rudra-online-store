package com.rudra.store.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FirebaseAuthService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthService.class);
    private final FirebaseAuth firebaseAuth;

    @Value("${admin.email:}")
    private String adminEmailConfig = "";

    @Value("${admin.emails:}")
    private String adminEmailsConfig = "";

    @Value("${admin.uids:}")
    private String adminUidsConfig = "";

    public FirebaseAuthService(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    /**
     * Verifies the Firebase ID token extracted from the Authorization header
     * and returns the decoded FirebaseToken.
     *
     * @param authorizationHeader HTTP Authorization header value (expected format: "Bearer <token>")
     * @return Verified FirebaseToken
     * @throws UnauthorizedException if header is missing, malformed, invalid, or expired
     */
    public FirebaseToken verifyToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.trim().isEmpty()) {
            logger.warn("Authentication failed: Missing Authorization header");
            throw new UnauthorizedException("Authentication token is required");
        }

        String trimmedStart = authorizationHeader.stripLeading();
        if (trimmedStart.equalsIgnoreCase("Bearer") || !trimmedStart.regionMatches(true, 0, "Bearer ", 0, 7)) {
            logger.warn("Authentication failed: Malformed Authorization header scheme");
            throw new UnauthorizedException("Invalid Authorization header format. Expected 'Bearer <token>'");
        }

        String idToken = trimmedStart.substring(7).trim();
        if (idToken.isEmpty()) {
            logger.warn("Authentication failed: Empty Bearer token");
            throw new UnauthorizedException("Bearer token cannot be empty");
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            if (uid == null || uid.trim().isEmpty()) {
                logger.warn("Authentication failed: Decoded token has empty UID");
                throw new UnauthorizedException("Invalid token payload: UID missing");
            }
            logger.debug("Firebase token successfully verified for UID: {}", uid);
            return decodedToken;
        } catch (FirebaseAuthException e) {
            // Never log full token; log only auth error code
            logger.warn("Firebase token verification failed with error code: {}", e.getAuthErrorCode());
            throw new UnauthorizedException("Authentication failed: Invalid or expired token");
        } catch (Exception e) {
            logger.warn("Unexpected error during Firebase token verification: {}", e.getClass().getSimpleName());
            throw new UnauthorizedException("Authentication failed: Unable to verify credentials");
        }
    }

    /**
     * Verifies the Firebase ID token extracted from the Authorization header
     * and returns the authenticated user's Firebase UID.
     */
    public String verifyTokenAndGetUid(String authorizationHeader) {
        return verifyToken(authorizationHeader).getUid();
    }

    /**
     * Verifies that the request has a valid Firebase token AND that the user has administrator privileges.
     *
     * @param authorizationHeader HTTP Authorization header value
     * @return Verified FirebaseToken with admin privileges
     * @throws UnauthorizedException if token is missing/invalid
     * @throws ForbiddenException if user is authenticated but not an admin
     */
    public FirebaseToken verifyAdmin(String authorizationHeader) {
        FirebaseToken token = verifyToken(authorizationHeader);
        if (!isUserAdmin(token)) {
            logger.warn("Authorization failed: User {} (email: {}) does not have admin privileges",
                    token.getUid(), token.getEmail());
            throw new ForbiddenException("Access denied: Administrator privileges required");
        }
        return token;
    }

    /**
     * Evaluates whether a given Firebase token possesses administrator privileges.
     * Enforces the security rule:
     * 1. Authenticated Firebase token present
     * 2. admin=true OR role=admin custom claim
     * 3. If ADMIN_EMAIL is configured, user email must match ADMIN_EMAIL
     */
    public boolean isUserAdmin(FirebaseToken token) {
        if (token == null) {
            return false;
        }

        // 1. Check custom claim "admin" (boolean)
        Object adminClaim = token.getClaims().get("admin");
        boolean hasAdminClaim = Boolean.TRUE.equals(adminClaim);

        // 2. Check custom claim "role" ("admin")
        Object roleClaim = token.getClaims().get("role");
        boolean hasAdminRole = roleClaim != null && "admin".equalsIgnoreCase(String.valueOf(roleClaim).trim());

        // Also check configured admin UIDs if present (for test/UID override compatibility)
        Set<String> configuredUids = parseConfigSet(adminUidsConfig);
        boolean hasAdminUid = !configuredUids.isEmpty() && token.getUid() != null && configuredUids.contains(token.getUid().trim());

        if (!hasAdminClaim && !hasAdminRole && !hasAdminUid) {
            return false;
        }

        // 3. If ADMIN_EMAIL is configured, require email to match configured ADMIN_EMAIL
        if (adminEmailConfig != null && !adminEmailConfig.trim().isEmpty()) {
            if (token.getEmail() == null || !adminEmailConfig.trim().equalsIgnoreCase(token.getEmail().trim())) {
                logger.warn("Authorization failed: User {} has admin custom claims but email '{}' does not match configured ADMIN_EMAIL '{}'",
                        token.getUid(), token.getEmail(), adminEmailConfig.trim());
                return false;
            }
        } else if (adminEmailsConfig != null && !adminEmailsConfig.trim().isEmpty()) {
            Set<String> configuredEmails = parseConfigSet(adminEmailsConfig);
            if (!configuredEmails.isEmpty()) {
                if (token.getEmail() == null || !configuredEmails.contains(token.getEmail().trim().toLowerCase())) {
                    logger.warn("Authorization failed: User {} has admin custom claims but email '{}' is not in configured admin emails",
                            token.getUid(), token.getEmail());
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Grants the admin role to a user by assigning custom Firebase claims.
     *
     * @param uid Target Firebase user UID
     * @throws FirebaseAuthException if Firebase Admin SDK call fails
     */
    public void promoteUserToAdmin(String uid) throws FirebaseAuthException {
        if (uid == null || uid.trim().isEmpty()) {
            throw new IllegalArgumentException("User UID cannot be blank for admin promotion");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("admin", true);
        claims.put("role", "admin");
        firebaseAuth.setCustomUserClaims(uid.trim(), claims);
        logger.info("Successfully assigned admin custom claims to UID: {}", uid);
    }

    private Set<String> parseConfigSet(String configValue) {
        if (configValue == null || configValue.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return Arrays.stream(configValue.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    // Setters for unit testing
    public void setAdminEmailConfig(String adminEmailConfig) {
        this.adminEmailConfig = adminEmailConfig;
    }

    public void setAdminEmailsConfig(String adminEmailsConfig) {
        this.adminEmailsConfig = adminEmailsConfig;
    }

    public void setAdminUidsConfig(String adminUidsConfig) {
        this.adminUidsConfig = adminUidsConfig;
    }
}

