import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const evaluateAdminRole = useCallback(async (user, forceRefresh = false) => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    try {
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      const hasAdminClaim =
        Boolean(tokenResult?.claims?.admin) ||
        String(tokenResult?.claims?.role).toLowerCase() === 'admin';

      // Optional fallback: VITE_ADMIN_EMAILS if specified in environment
      const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const hasAdminEmail =
        user.email && envAdminEmails.includes(user.email.trim().toLowerCase());

      const adminResolved = Boolean(hasAdminClaim || hasAdminEmail);
      setIsAdmin(adminResolved);
      return adminResolved;
    } catch (err) {
      console.warn('Error evaluating admin claims:', err);
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await evaluateAdminRole(user, false);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [evaluateAdminRole]);

  /**
   * Forces a fresh ID token fetch from Firebase and re-evaluates admin claims.
   * Useful immediately after one-time admin promotion.
   */
  const refreshAdminStatus = useCallback(async () => {
    if (!auth.currentUser) return false;
    return await evaluateAdminRole(auth.currentUser, true);
  }, [evaluateAdminRole]);

  /**
   * Register a new user with email, password, and full display name.
   */
  const register = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      setCurrentUser({ ...userCredential.user, displayName });
    }
    await evaluateAdminRole(userCredential.user, false);
    return userCredential.user;
  };

  /**
   * Sign in an existing user with email and password.
   */
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const resolvedAdmin = await evaluateAdminRole(userCredential.user, false);
    userCredential.user.isAdmin = resolvedAdmin;
    return userCredential.user;
  };

  /**
   * Sign in using Firebase Google Authentication popup.
   */
  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const resolvedAdmin = await evaluateAdminRole(userCredential.user, false);
    userCredential.user.isAdmin = resolvedAdmin;
    return userCredential.user;
  };

  /**
   * Sign out the currently authenticated user.
   */
  const logout = async () => {
    setIsAdmin(false);
    return signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    refreshAdminStatus,
    register,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

