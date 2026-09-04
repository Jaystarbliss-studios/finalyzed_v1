import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {Clock,Wallet,CheckCircle,TrendingUp,RefreshCw,ChevronRight} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import DashboardAnalytics from '../components/DashboardAnalytics';
import WriterCommissionPanel from '../components/WriterCommissionPanel';
import WriterProjectTransferPanel from '../components/WriterProjectTransferPanel';

const label=(s:string)=>String(s||'').replace(/_/g,' ');

/** Keep Supabase RPC failures visible without logging auth tokens or session data. */
async function callWriterRpc<T=any>(name:string,args?:Record<string,unknown>){
 const started=Date.now();
 console.info(`[Finalyzed][Supabase RPC] calling ${name}`,args?Object.keys(args):[]);
 const result=args===undefined?await supabase.rpc(name):await supabase.rpc(name,args);
 const elapsed=Date.now()-started;
 if(result.error){
  console.error(`[Finalyzed][Supabase RPC] ${name} FAILED after ${elapsed}ms`,{
   message:result.error.message,code:result.error.code,details:result.error.details,hint:result.error.hint,
  });
 }else{
  const rows=Array.isArray(result.data)?result.data.length:(result.data==null?0:1);
  console.info(`[Finalyzed][Supabase RPC] ${name} OK after ${elapsed}ms`,{rows});
 }
 return result as {data:T|null;error:any};
}

export default function SpecialistDashboard(){
 const {user,userData}=useAuth();
 const [available,setAvailable]=useState<any[]>([]);const [projects,setProjects]=useState<any[]>([]);const [revisions,setRevisions]=useState<any[]>([]);const [wallet,setWallet]=useState<any>(null);const [filter,setFilter]=useState('active');const [loading,setLoading]=useState(true);const [loadError,setLoadError]=useState('');const [secondaryError,setSecondaryError]=useState('');
 useEffect(()=>{
  if(!user)return;let live=true;
  const load=async()=>{
   setLoading(true);setLoadError('');setSecondaryError('');
   console.info('[Finalyzed][Writer Dashboard] loading writer data from Supabase');
   // Projects are the critical request. Secondary failures must not hide them.
   const projectsResult=await callWriterRpc<any[]>('get_my_writer_projects');
   if(!live)return;
   if(projectsResult.error){
    setLoadError(`get_my_writer_projects failed: ${projectsResult.error.message||'Unknown Supabase error'}`);
   }else{
    const rows=projectsResult.data||[];setProjects(rows);
    console.info('[Finalyzed][Writer Dashboard] writer projects received',{count:rows.length});
    if(rows.length){
     const ids=rows.map(x=>x.id).filter(Boolean);
     console.info('[Finalyzed][Supabase] loading project_revisions',{projectCount:ids.length});
     const q=await supabase.from('project_revisions').select('*').in('project_id',ids).order('created_at',{ascending:false});
     if(q.error){
      console.error('[Finalyzed][Supabase] project_revisions FAILED',{message:q.error.message,code:q.error.code,details:q.error.details,hint:q.error.hint});
      setSecondaryError(`Project revisions could not be loaded: ${q.error.message}`);
     }else{setRevisions(q.data||[]);console.info('[Finalyzed][Supabase] project_revisions OK',{count:(q.data||[]).length});}
    }else setRevisions([]);
   }
   const [walletResult,availableResult]=await Promise.all([
    supabase.from('wallets').select('*').eq('user_id',user.id).maybeSingle(),
    callWriterRpc<any[]>('get_available_writer_projects'),
   ]);
   if(!live)return;
   if(walletResult.error){
    console.error('[Finalyzed][Supabase] wallets FAILED',{message:walletResult.error.message,code:walletResult.error.code,details:walletResult.error.details,hint:walletResult.error.hint});
    setSecondaryError(prev=>prev||`Wallet could not be loaded: ${walletResult.error.message}`);
   }else{setWallet(walletResult.data||null);console.info('[Finalyzed][Supabase] wallets OK');}
   if(availableResult.error){
    console.error('[Finalyzed][Supabase RPC] get_available_writer_projects FAILED; keeping My Projects usable');
    setSecondaryError(prev=>prev||`Available projects could not be loaded: ${availableResult.error.message}`);
   }else setAvailable(availableResult.data||[]);
   setLoading(false);console.info('[Finalyzed][Writer Dashboard] Supabase load complete');
  };
  void load().catch(error=>{console.error('[Finalyzed][Writer Dashboard] unexpected load failure',error);if(live){setLoadError(error instanceof Error?error.message:'Unable to load writer projects.');setLoading(false);}});
  return()=>{live=false};
 },[user]);
 const shown=useMemo(()=>filter==='all'?projects:filter==='active'?projects.filter(p=>!['completed','cancelled'].includes(p.status)):projects.filter(p=>p.status===filter),[projects,filter]);const pending=revisions.filter(r=>['requested','pending','accepted'].includes(r.status));
 if(loading)return <div className="p-8 text-center text-muted-foreground">Loading writer portal…</div>;
 if(loadError)return <div className="w-full max-w-2xl mx-auto px-4 py-12"><div className="bento-card p-6 text-center"><h1 className="text-xl font-bold">Unable to load writer projects</h1><p className="text-sm text-muted-foreground mt-2">{loadError}</p><p className="text-xs text-muted-foreground mt-3">Open the browser console to see the exact Supabase RPC error.</p><button onClick={()=>window.location.reload()} className="btn-primary mt-5 px-4 py-2">Retry</button></div></div>;
 return <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6"><header><span className="mono-label">Finalyzed Writer Portal</span><h1 className="text-3xl font-light mt-2">Welcome, <b>{userData?.name?.split(' ')[0]||'Finalyzed Writer'}</b></h1><p className="text-sm text-muted-foreground mt-2">Assignments, revisions, transfers, commissions and earnings stay connected to each project.</p></header>
 <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"><Metric icon={<Wallet/>} label="Available cash" value={'₦'+Number(wallet?.balance_ngn||0).toLocaleString('en-NG')}/><Metric icon={<TrendingUp/>} label="Finalyzed Points" value={Number(wallet?.points_balance||0).toLocaleString()}/><Metric icon={<CheckCircle/>} label="Completed" value={String(projects.filter(p=>p.status==='completed').length)}/><Metric icon={<Clock/>} label="Active" value={String(projects.filter(p=>!['completed','cancelled'].includes(p.status)).length)}/></div>
 <DashboardAnalytics role="writer" projects={projects} revisions={revisions}/>
 {secondaryError&&<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600">Some secondary writer data could not be loaded. Your projects remain available. Check the browser console for the exact Supabase error.</div>}
 {user?.id&&<><WriterCommissionPanel projects={projects} wallet={wallet} userId={user.id} onChanged={()=>window.location.reload()}/><WriterProjectTransferPanel projects={projects} userId={user.id} onChanged={()=>window.location.reload()}/></>}
 <section className="bento-card p-6"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">Available projects</h2><p className="text-sm text-muted-foreground">Paid projects currently waiting for a Finalyzed Writer assignment.</p></div><span className="badge-verified">{available.length} available</span></div>{available.length===0?<p className="text-sm text-muted-foreground py-5 text-center">No unassigned paid projects are waiting right now.</p>:<div className="divide-y divide-border">{available.map(p=><Link key={p.id} to={'/workspace/'+p.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{p.title}</p><p className="text-sm text-muted-foreground">{p.plan} · ₦{Number(p.price_ngn||0).toLocaleString('en-NG')}</p></div><ChevronRight className="w-4 h-4 text-primary"/></Link>)}</div>}</section>
 <section className="bento-card p-6"><div className="flex items-center gap-3 mb-4"><RefreshCw className="w-5 h-5 text-primary"/><div><h2 className="text-xl font-bold">Revision Queue</h2><p className="text-sm text-muted-foreground">Student requests that require your attention.</p></div></div>{pending.length===0?<p className="text-muted-foreground py-6 text-center">No pending revision requests.</p>:<div className="divide-y divide-border">{pending.map(r=><Link key={r.id} to={'/workspace/'+r.project_id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-semibold">{r.request_text||'Revision requested'}</p><p className="text-xs text-muted-foreground mt-1">Status: {label(r.status)}</p></div><ChevronRight className="w-4 h-4 text-primary"/></Link>)}</div>}</section>
 <section className="bento-card p-6"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5"><h2 className="text-xl font-bold">My Projects</h2><div className="flex flex-wrap gap-2">{['active','all','assigned','in_progress','revision_requested','editor_correction_required','completed'].map(f=><button key={f} onClick={()=>setFilter(f)} className={'px-3 py-1.5 rounded-full text-xs font-semibold border '+(filter===f?'bg-primary text-primary-foreground border-primary':'border-border text-muted-foreground')}>{f==='editor_correction_required'?'Corrections':f.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}</div></div>{shown.length===0?<p className="text-muted-foreground py-8 text-center">No projects in this view.</p>:<div className="divide-y divide-border">{shown.map(p=><Link key={p.id} to={'/workspace/'+p.id} className="flex flex-col sm:flex-row sm:justify-between gap-3 py-5 px-2 hover:bg-muted/30 rounded-lg"><div><h3 className="font-semibold">{p.title}</h3><p className="text-sm text-muted-foreground mt-1">{p.plan} · deadline {p.deadline_at?new Date(p.deadline_at).toLocaleString('en-NG'):'not assigned'}</p></div><div className="flex items-center gap-2"><span className="text-xs uppercase font-bold text-primary">{label(p.status)}</span><ChevronRight className="w-4 h-4"/></div></Link>)}</div>}</section></div>
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="bento-card p-4 md:p-6"><div className="w-5 h-5 text-primary">{icon}</div><p className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>}