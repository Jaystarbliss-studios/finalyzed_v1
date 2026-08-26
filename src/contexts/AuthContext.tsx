import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, type FinalyzedRole } from '../lib/supabase';

export type AccountStatus = 'NEW' | 'ONBOARDING' | 'ACTIVE' | 'PENDING_REVIEW' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | 'DEACTIVATED';
export interface UserData { id?: string; role?: FinalyzedRole; capabilities?: FinalyzedRole[]; status?: AccountStatus; onboardingComplete?: boolean; name?: string; email?: string; photoURL?: string; phone?: string; createdAt?: string; updatedAt?: string; studentProfile?: Record<string, unknown>; specialistProfile?: Record<string, unknown>; editorProfile?: Record<string, unknown>; [key: string]: unknown; }
interface AuthContextType { user: User | null; userData: UserData | null; loading: boolean; refreshUserData: () => Promise<void>; }
const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true, refreshUserData: async () => undefined });
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setUserData(null); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
    if (error) { console.error('Error fetching Finalyzed profile:', error); setUserData(null); return; }
    setUserData(data ? { id: data.id, role: data.role, status: data.account_status === 'pending' ? 'PENDING_REVIEW' : data.account_status === 'suspended' ? 'SUSPENDED' : data.account_status === 'rejected' ? 'REJECTED' : 'ACTIVE', onboardingComplete: Boolean(data.full_name), name: data.full_name, email: currentUser.email, photoURL: data.avatar_url, createdAt: data.created_at, updatedAt: data.updated_at } : null);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => { if (!mounted) return; setUser(session?.user ?? null); if (session?.user) await refreshUserData(); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => { if (!mounted) return; setUser(session?.user ?? null); if (session?.user) await refreshUserData(); else setUserData(null); setLoading(false); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>{children}</AuthContext.Provider>;
};
