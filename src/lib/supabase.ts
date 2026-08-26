import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Finalyzed Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://doxzkgmouzndxtfuaxqk.supabase.co',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type FinalyzedRole = 'student' | 'writer' | 'editor' | 'admin';

export const PLAN_CONFIG = {
  basic: { pages: 'Up to 62 pages', revisions: 3, price: 0, projectSlide: false, presentationGuide: false, maxEditorPoints: 500 },
  standard: { pages: 'Up to 75 pages', revisions: 5, price: 0, projectSlide: true, presentationGuide: false, maxEditorPoints: 1000 },
  premium: { pages: '100–150 pages', revisions: 10, price: 0, projectSlide: true, presentationGuide: true, maxEditorPoints: 5000 },
} as const;

export const POINT_NAIRA_VALUE = 10;
export const MIN_WITHDRAWAL_NAIRA = 5000;
export const WITHDRAWAL_FEE_NAIRA = 0;

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyWallet() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}
