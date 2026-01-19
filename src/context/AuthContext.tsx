import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("=== AUTH STATE CHANGED ===");
      console.log("User:", user);
      
      if (user) {
        try {
          console.log("User logged in, checking Firestore document...");
          // Auto-create user document in Firestore if not exists
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.log("User document doesn't exist, creating...");
            // Create user document
            await setDoc(userDocRef, {
              email: user.email,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
            console.log("User document created successfully");
          } else {
            console.log("User document exists, updating lastLogin...");
            // Update last login
            await setDoc(userDocRef, {
              lastLogin: serverTimestamp(),
            }, { merge: true });
            console.log("User document updated successfully");
          }
        } catch (error) {
          console.error("Error creating/updating user document:", error);
        }
      } else {
        console.log("User logged out or not authenticated");
      }
      
      setUser(user);
      setLoading(false);
      console.log("=== AUTH STATE UPDATE COMPLETE ===");
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}