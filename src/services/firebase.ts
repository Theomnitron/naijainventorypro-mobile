import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
// @ts-ignore - Bypass false-positive Firebase Mobile SDK declaration gap
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Web/Mobile Shared Firebase Credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_FIREBASE_API_KEY as string,
  authDomain: "naijainventorypro.firebaseapp.com",
  projectId: "naijainventorypro",
  storageBucket: "naijainventorypro.appspot.com",
  messagingSenderId: process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.EXPO_FIREBASE_APP_ID
};

// Initialize Firebase App Instance cleanly without duplicate instance crashes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with high-performance, mobile-native persistent local caching
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Auth with mobile-native AsyncStorage session persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, db, auth };