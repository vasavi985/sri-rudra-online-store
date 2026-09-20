import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Evaluates if the authenticated user has verified administrator custom claims.
   */
  const evaluateAdminClaims = useCallback(async (user, forceRefresh = false) => {
    if (!user) return false;

    try {
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      const hasClaim =
        tokenResult?.claims?.admin === true ||
        String(tokenResult?.claims?.role).toLowerCase() === 'admin';

      return Boolean(hasClaim);
    } catch (err) {
      console.warn('Error evaluating token claims:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const verifiedAdmin = await evaluateAdminClaims(user, false);
        if (verifiedAdmin) {
          setCurrentUser(user);
          setIsAdmin(true);
        } else {
          // If a non-admin account is currently signed in, sign out immediately
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [evaluateAdminClaims]);

  /**
   * Authenticates store manager with email/password and enforces admin custom claim.
   */
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const verifiedAdmin = await evaluateAdminClaims(userCredential.user, true);

    if (!verifiedAdmin) {
      // Immediately terminate unauthorized session
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      const unauthorizedErr = new Error("You don't have permission to access the store administration.");
      unauthorizedErr.code = 'auth/unauthorized-admin';
      throw unauthorizedErr;
    }

    setCurrentUser(userCredential.user);
    setIsAdmin(true);
    return userCredential.user;
  };

  /**
   * Triggers Firebase password reset email.
   */
  const requestPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  /**
   * Signs out manager and clears state.
   */
  const logout = async () => {
    setCurrentUser(null);
    setIsAdmin(false);
    return signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    login,
    requestPasswordReset,
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
