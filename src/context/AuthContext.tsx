
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from '../services/firebase'; // Assuming you have firebase initialized and exported from a 'firebase.ts' file
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const SESSION_TOKEN_KEY = 'session_token';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isExpired: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const isConnected = useNetworkStatus();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await SecureStore.setItemAsync(SESSION_TOKEN_KEY, await user.getIdToken(), {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        setUser(user);
      } else {
        await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isConnected) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const { trialExpirationDate, subscriptionExpirationDate } = data;
          const now = Date.now() / 1000; // Convert to Unix timestamp in seconds

          if (trialExpirationDate && now > trialExpirationDate) {
            setIsExpired(true);
          } else if (subscriptionExpirationDate && now > subscriptionExpirationDate) {
            setIsExpired(true);
          } else {
            setIsExpired(false);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user, isConnected]);

  const loginWithEmail = async (email: string, pass: string) => {
    // Implement your email/password login logic here
    // For example:
    // await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isExpired, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
