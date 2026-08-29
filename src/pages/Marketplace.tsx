import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Clock, CheckCircle, ArrowRight, ShieldCheck, User, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Specialist {
  id: string;
  name: string;
  isVerified?: boolean;
  rating?: number;
  reviews?: number;
  completedProjects?: number;
  averageDeliveryDays?: number;
  approvalRate?: number;
  specialties?: string[];
  imageUrl?: string;
  bio?: string;
}

export default function Marketplace() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => { let cancelled=false; (async()=>{ const {data,error}=await supabase.from('public_profiles').select('*').order('ranking_score',{ascending:false}).order('rating',{ascending:false}).order('completed_projects',{ascending:false}); if(!cancelled)setSpecialists((data||[]).map((s:any)=>({id:s.id,name:s.display_name,isVerified:s.verified,rating:Number(s.rating||0),reviews:Number(s.review_count||0),completedProjects:Number(s.completed_projects||0),averageDeliveryDays:Number(s.average_delivery_days||0),approvalRate:Number(s.accuracy_score||0),specialties:s.specialties||[],imageUrl:s.avatar_url,bio:s.bio}))); setLoading(false); })(); return()=>{cancelled=true}; }, []);
  const filteredSpecialists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return specialists.filter(s => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.specialties || []).some(spec => spec.toLowerCase().includes(q));
      return matchesSearch && (!verifiedOnly || s.isVerified === true);
    });
  }, [specialists, searchQuery, verifiedOnly]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col gap-7">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5">
        <div>
          <span className="mono-label">Finalyzed Marketplace</span>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find a Project Writer</h1>
              <p className="text-sm text-muted-foreground mt-1">Compare verified specialists by expertise, delivery speed, ratings and quality performance.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="search" aria-label="Search project writers" placeholder="Search specialty or name…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <button onClick={() => setVerifiedOnly(v => !v)} aria-pressed={verifiedOnly} className={`btn-secondary px-4 py-3 flex items-center justify-center gap-2 ${verifiedOnly ? 'border-primary text-primary bg-primary/5' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" /> {verifiedOnly ? 'Verified only' : 'All writers'}
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{loading ? 'Finding available specialists…' : `${filteredSpecialists.length} available specialist${filteredSpecialists.length === 1 ? '' : 's'}`}</span>
        <span className="hidden sm:flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verification is managed by Finalyzed</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bento-card p-6 h-72 animate-pulse"><div className="w-10 h-10 bg-muted rounded-xl mb-3" /><div className="w-2/3 h-5 bg-muted rounded mb-3" /><div className="w-full h-4 bg-muted rounded mb-2" /><div className="w-1/2 h-4 bg-muted rounded" /></div>)}
        </div>
      ) : filteredSpecialists.length === 0 ? (
        <div className="bento-card p-10 md:p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5"><Search className="w-7 h-7 text-primary" /></div>
          <h2 className="text-xl font-bold">No writers match your search</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2">Try a different subject, department or specialist name. New verified writers appear here after their Finalyzed profile is approved.</p>
          {verifiedOnly && <button onClick={() => setVerifiedOnly(false)} className="mt-5 text-sm font-semibold text-primary hover:underline">Show all available writers</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist, idx) => {
            const specialties = specialist.specialties || [];
            return (
              <motion.article key={specialist.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bento-card p-3 md:p-4 flex flex-col hover:border-primary/40 transition-all group">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-primary/5 shrink-0">
                    {specialist.imageUrl ? <img src={specialist.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>}
                  </div>
                  {specialist.isVerified ? <span className="bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /><span className="text-[9px] font-bold text-primary uppercase tracking-wider">Verified</span></span> : <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg">Unverified</span>}
                </div>

                <h2 className="text-sm md:text-base font-bold">{specialist.name}</h2>
                {specialist.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-snug text-xs">{specialist.bio}</p>}

                <div className="flex flex-wrap gap-1 mt-3">
                  {specialties.slice(0, 3).map(spec => <span key={spec} className="text-[10px] px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">{spec}</span>)}
                  {specialties.length > 3 && <span className="text-[10px] px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">+{specialties.length - 3}</span>}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                  <Metric icon={<Star className="w-3.5 h-3.5" />} value={typeof specialist.rating === 'number' ? specialist.rating.toFixed(1) : '—'} label={`${specialist.reviews || 0} reviews`} />
                  <Metric icon={<CheckCircle className="w-3.5 h-3.5" />} value={specialist.completedProjects?.toString() || '—'} label="completed" />
                  <Metric icon={<Clock className="w-3.5 h-3.5" />} value={specialist.averageDeliveryDays ? `${specialist.averageDeliveryDays}d` : '—'} label="avg delivery" />
                </div>

                <Link to={`/specialists/${specialist.id}`} className="btn-secondary w-full py-2 flex items-center justify-center gap-1 text-xs mt-6 group-hover:border-primary group-hover:text-primary transition-colors">View Profile <ArrowRight className="w-4 h-4" /></Link>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div><div className="flex items-center gap-1.5 font-bold text-sm text-foreground">{React.cloneElement(icon as React.ReactElement, { className: 'text-primary' })}{value}</div><span className="text-[10px] text-muted-foreground block mt-0.5">{label}</span></div>;
}
