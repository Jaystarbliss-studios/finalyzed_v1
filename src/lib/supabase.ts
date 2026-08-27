import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) console.warn('Finalyzed Supabase environment variables are missing.');

export const supabase = createClient(
  supabaseUrl || 'https://doxzkgmouzndxtfuaxqk.supabase.co',
  supabaseAnonKey || '',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export type FinalyzedRole = 'student' | 'writer' | 'editor' | 'admin';
export type PlanType = 'basic' | 'standard' | 'premium';
export const PLAN_CONFIG = {
  basic: { pages:'Up to 62 pages', revisions:3, price:0, projectSlide:false, presentationGuide:false, maxEditorPoints:500 },
  standard: { pages:'Up to 75 pages', revisions:5, price:0, projectSlide:true, presentationGuide:false, maxEditorPoints:1000 },
  premium: { pages:'100–150 pages', revisions:10, price:0, projectSlide:true, presentationGuide:true, maxEditorPoints:5000 },
} as const;
export const POINT_NAIRA_VALUE = 10;
export const MIN_WITHDRAWAL_NAIRA = 5000;

export async function getMyProfile(){ const {data:{user}}=await supabase.auth.getUser(); if(!user)return null; const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(); if(error)throw error; return data; }
export async function getMyProjects(){ const {data,error}=await supabase.from('projects').select('*').order('created_at',{ascending:false}); if(error)throw error; return data??[]; }
export async function getMyWallet(){ const {data:{user}}=await supabase.auth.getUser(); if(!user)return null; const {data,error}=await supabase.from('wallets').select('*').eq('user_id',user.id).maybeSingle(); if(error)throw error; return data; }
export async function getAvailableWriters(search=''){ let query=supabase.from('public_profiles').select('*').eq('verified',true).order('rating',{ascending:false}).order('completed_projects',{ascending:false}); if(search.trim()) query=query.or(`display_name.ilike.%${search.trim()}%,bio.ilike.%${search.trim()}%`); const {data,error}=await query; if(error)throw error; return data??[]; }
export async function createProjectFromSpecification(specificationId:string,plan:PlanType,priceNgn:number,writerId?:string){ const {data,error}=await supabase.rpc('create_project_from_spec',{p_specification_id:specificationId,p_plan:plan,p_price_ngn:priceNgn,p_writer_id:writerId||null}); if(error)throw error; return data; }
export async function requestRevision(projectId:string,requestText:string,pointsCost=0){ const {data,error}=await supabase.rpc('request_project_revision',{p_project_id:projectId,p_request_text:requestText,p_points_cost:pointsCost}); if(error)throw error; return data; }
export async function approveDelivery(projectId:string){ const {data,error}=await supabase.rpc('approve_project_delivery',{p_project_id:projectId}); if(error)throw error; return data; }
export async function debitPoints(points:number,reason:string,projectId?:string){ const {data,error}=await supabase.rpc('debit_points',{p_points:points,p_reason:reason,p_project_id:projectId??null}); if(error)throw error; return data; }
