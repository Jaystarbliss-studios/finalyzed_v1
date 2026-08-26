import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type FinalyzedRole = 'student' | 'specialist' | 'editor' | 'admin';
export type AccountStatus = 'NEW' | 'ONBOARDING' | 'ACTIVE' | 'PENDING_REVIEW' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | 'DEACTIVATED';

export interface UserData {
  role?: FinalyzedRole;
  capabilities?: FinalyzedRole[];
  status?: AccountStatus;
  onboardingComplete?: boolean;
  name?: string;
  email?: string;
  photoURL?: string;
  phone?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  studentProfile?: Record<string, unknown>;
  specialistProfile?: Record<string, unknown>;
  editorProfile?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!auth.currentUser) {
      setUserData(null);
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setUserData(snapshot.exists() ? (snapshot.data() as UserData) : null);
    } catch (error) {
      console.error('Error fetching Finalyzed user profile:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (currentUser) {
        await refreshUserData();
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
