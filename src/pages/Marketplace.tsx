import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Clock, CheckCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface Specialist {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
  reviews: number;
  completedProjects: number;
  averageDeliveryDays: number;
  approvalRate: number;
  specialties: string[];
  imageUrl: string;
}

export default function Marketplace() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch from our local full-stack API
    fetch('/api/specialists')
      .then(res => res.json())
      .then(data => {
        setSpecialists(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch specialists:", err);
        setLoading(false);
      });
  }, []);

  const filteredSpecialists = specialists.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div className="flex flex-col">
          <span className="mono-label">Marketplace Matrix</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-2 h-6 bg-primary"></div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              SPECIALIST.<span className="opacity-50 font-light">DISCOVERY</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search specialty or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button className="btn-secondary p-2 flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bento-card p-6">
            <span className="mono-label mb-4 block">Refine Search</span>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Project Type</h4>
                <div className="space-y-2">
                  {['Research Study', 'Software Dev', 'Design & Construct', 'Case Study'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-border bg-background group-hover:border-primary transition-colors flex items-center justify-center"></div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Verification Level</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded border border-primary bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-sm"></div>
                    </div>
                    <span className="text-sm text-foreground">Finalyzed Verified</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded border border-border bg-background flex items-center justify-center"></div>
                    <span className="text-sm text-muted-foreground">Standard Verified</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bento-card p-6 h-64 animate-pulse">
                   <div className="w-16 h-16 bg-white/5 rounded-xl mb-4"></div>
                   <div className="w-1/2 h-6 bg-white/5 rounded mb-2"></div>
                   <div className="w-1/3 h-4 bg-white/5 rounded mb-8"></div>
                   <div className="w-full h-12 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredSpecialists.length === 0 ? (
            <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">No specialists found</h3>
              <p className="text-muted-foreground">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSpecialists.map((specialist, idx) => (
                <motion.div 
                  key={specialist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bento-card p-6 flex flex-col hover:border-primary/50 transition-colors group"
                >
                  <div className="bento-glow group-hover:opacity-20 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 shrink-0">
                      {specialist.imageUrl ? (
                        <img src={specialist.imageUrl} alt={specialist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                    {specialist.isVerified && (
                      <div className="bg-primary/10 border border-primary/20 px-2 py-1 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4 relative z-10">
                    <h3 className="text-lg font-medium text-foreground">{specialist.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {specialist.specialties.slice(0, 2).map(spec => (
                        <span key={spec} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-muted-foreground">
                          {spec}
                        </span>
                      ))}
                      {specialist.specialties.length > 2 && (
                        <span className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-muted-foreground">
                          +{specialist.specialties.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 mt-auto border-t border-white/5 pt-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-1 text-foreground font-medium text-sm mb-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-current" />
                        {specialist.rating.toFixed(1)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{specialist.reviews} Reviews</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-foreground font-medium text-sm mb-1">
                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        {specialist.approvalRate}%
                      </div>
                      <span className="text-[10px] text-muted-foreground block">QA Approval</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-foreground font-medium text-sm mb-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {specialist.averageDeliveryDays} Days
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Avg. Delivery Speed</span>
                    </div>
                  </div>
                  
                  <Link to={`/specialist/${specialist.id}`} className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-sm relative z-10 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all shadow-none group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                    View Profile
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
