import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnn2qaklOv3i5rc_j2RvCtITinZnITI0s",
  authDomain: "wonogiri-56280.firebaseapp.com",
  projectId: "wonogiri-56280",
  storageBucket: "wonogiri-56280.firebasestorage.app",
  messagingSenderId: "664243681026",
  appId: "1:664243681026:web:d938a0177fd553e779741b",
  measurementId: "G-GBLFYK8SYB"
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