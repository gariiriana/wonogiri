import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5COjUKUcVK6DjsLWF9j7IR0nsg9dzHQY",
  authDomain: "wonogiri-8e0eb.firebaseapp.com",
  projectId: "wonogiri-8e0eb",
  storageBucket: "wonogiri-8e0eb.firebasestorage.app",
  messagingSenderId: "4415449174",
  appId: "1:4415449174:web:38b65b3a426aa70c8073f7",
  measurementId: "G-HEQS28TT51"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);

// Initialize Firestore with memory cache to avoid BloomFilter errors
// Try to initialize with custom cache, fallback to getFirestore if already initialized
let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
} catch (error) {
  // If already initialized, just get the existing instance
  db = getFirestore(app);
}

export { db };

export default app;