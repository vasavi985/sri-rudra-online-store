package com.rudra.store.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.rudra.store.exception.ForbiddenException;
import com.rudra.store.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FirebaseAuthServiceTest {

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private FirebaseAuthService authService;

    @Test
    void verifyToken_shouldThrowWhenHeaderIsNull() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.verifyTokenAndGetUid(null));
        assertEquals("Authentication token is required", ex.getMessage());
    }

    @Test
    void verifyToken_shouldThrowWhenHeaderDoesNotStartWithBearer() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.verifyTokenAndGetUid("Basic 123456"));
        assertTrue(ex.getMessage().contains("Invalid Authorization header format"));
    }

    @Test
    void verifyToken_shouldThrowWhenBearerTokenIsEmpty() {
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.verifyTokenAndGetUid("Bearer    "));
        assertEquals("Bearer token cannot be empty", ex.getMessage());
    }

    @Test
    void verifyToken_shouldReturnUidWhenValid() throws Exception {
        when(firebaseAuth.verifyIdToken("valid-token-xyz")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("customer-uid-999");

        String uid = authService.verifyTokenAndGetUid("Bearer valid-token-xyz");
        assertEquals("customer-uid-999", uid);
    }

    @Test
    void verifyToken_shouldThrowUnauthorizedWhenFirebaseAuthFails() throws Exception {
        FirebaseAuthException mockException = mock(FirebaseAuthException.class);
        when(mockException.getAuthErrorCode()).thenReturn(null);
        when(firebaseAuth.verifyIdToken("expired-token")).thenThrow(mockException);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                authService.verifyTokenAndGetUid("Bearer expired-token"));
        assertTrue(ex.getMessage().contains("Invalid or expired token"));
    }

    @Test
    void verifyAdmin_shouldThrowForbiddenWhenUserIsNotAdmin() throws Exception {
        when(firebaseAuth.verifyIdToken("customer-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("regular-user-1");
        when(firebaseToken.getClaims()).thenReturn(Collections.emptyMap());

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                authService.verifyAdmin("Bearer customer-token"));
        assertTrue(ex.getMessage().contains("Administrator privileges required"));
    }

    @Test
    void verifyAdmin_shouldSucceedWhenUserHasAdminClaim() throws Exception {
        when(firebaseAuth.verifyIdToken("admin-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("admin-user-1");
        Map<String, Object> claims = new HashMap<>();
        claims.put("admin", true);
        when(firebaseToken.getClaims()).thenReturn(claims);

        FirebaseToken result = authService.verifyAdmin("Bearer admin-token");
        assertNotNull(result);
        assertEquals("admin-user-1", result.getUid());
    }

    @Test
    void verifyAdmin_shouldSucceedWhenUserHasAdminRoleClaim() throws Exception {
        when(firebaseAuth.verifyIdToken("admin-role-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("admin-user-role");
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "admin");
        when(firebaseToken.getClaims()).thenReturn(claims);

        FirebaseToken result = authService.verifyAdmin("Bearer admin-role-token");
        assertNotNull(result);
        assertEquals("admin-user-role", result.getUid());
    }

    @Test
    void verifyAdmin_shouldSucceedWhenAdminClaimAndEmailMatchConfig() throws Exception {
        authService.setAdminEmailConfig("srirudra28@gmail.com");
        when(firebaseAuth.verifyIdToken("admin-email-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("sri-rudra-uid");
        Map<String, Object> claims = new HashMap<>();
        claims.put("admin", true);
        when(firebaseToken.getClaims()).thenReturn(claims);
        when(firebaseToken.getEmail()).thenReturn("srirudra28@gmail.com");

        FirebaseToken result = authService.verifyAdmin("Bearer admin-email-token");
        assertNotNull(result);
        assertEquals("sri-rudra-uid", result.getUid());
    }

    @Test
    void verifyAdmin_shouldThrowForbiddenWhenAdminClaimPresentButEmailMismatchesConfig() throws Exception {
        authService.setAdminEmailConfig("srirudra28@gmail.com");
        when(firebaseAuth.verifyIdToken("other-admin-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("other-admin-uid");
        Map<String, Object> claims = new HashMap<>();
        claims.put("admin", true);
        when(firebaseToken.getClaims()).thenReturn(claims);
        when(firebaseToken.getEmail()).thenReturn("other@example.com");

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                authService.verifyAdmin("Bearer other-admin-token"));
        assertTrue(ex.getMessage().contains("Administrator privileges required"));
    }

    @Test
    void verifyAdmin_shouldThrowForbiddenWhenEmailMatchesConfigButAdminClaimIsMissing() throws Exception {
        authService.setAdminEmailConfig("srirudra28@gmail.com");
        when(firebaseAuth.verifyIdToken("no-claim-token")).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn("regular-user-uid");
        when(firebaseToken.getClaims()).thenReturn(Collections.emptyMap());

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                authService.verifyAdmin("Bearer no-claim-token"));
        assertTrue(ex.getMessage().contains("Administrator privileges required"));
    }

    @Test
    void promoteUserToAdmin_shouldSetCustomUserClaims() throws Exception {
        authService.promoteUserToAdmin("target-uid-123");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(firebaseAuth).setCustomUserClaims(eq("target-uid-123"), captor.capture());

        Map<String, Object> claims = captor.getValue();
        assertEquals(true, claims.get("admin"));
        assertEquals("admin", claims.get("role"));
    }
}

