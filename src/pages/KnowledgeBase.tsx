import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Building2, CheckCircle, AlertCircle, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { (async()=>{ const {data}=await supabase.from('institutions').select('*').order('name',{ascending:true}); setInstitutions(data||[]); setLoading(false); })(); }, []);
  const filteredInstitutions = institutions.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <span className="mono-label">Institutional Requirements</span>
        <h1 className="text-3xl md:text-5xl font-light tracking-tight mt-4 mb-6">
          THE <span className="font-bold">KNOWLEDGE BASE</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Finalyzed maintains a growing repository of formatting standards, chapter structures, and citation requirements across major universities to ensure your project meets departmental standards.
        </p>
      </div>

      <div className="max-w-2xl mx-auto relative mb-16">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground focus:ring-primary focus:border-primary transition-all shadow-sm"
          placeholder="Search for your university or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading knowledge base...</div>
        ) : (
          filteredInstitutions.map((inst, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={inst.id} 
              className="bento-card p-6 md:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    {inst.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {inst.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle className="w-3 h-3" /> Verified Guidelines
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        <AlertCircle className="w-3 h-3" /> Community Observed
                      </span>
                    )}
                  </div>
                </div>
                <Link to="/start-project" className="btn-secondary whitespace-nowrap text-sm">
                  Start Project Here
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inst.guidelines?.map((guide: any) => (
                  <div key={guide.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block mb-2">{guide.type}</span>
                    <p className="text-sm">{guide.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
        
        {!loading && filteredInstitutions.length === 0 && (
          <div className="text-center py-12 bento-card">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">Institution Not Found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              We haven't indexed specific requirements for this search yet. Our specialists will manually verify the requirements during your project specification.
            </p>
            <Link to="/start-project" className="btn-primary">
              Start Project Anyway
            </Link>
          </div>
        )}
      </div>
      
      <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center max-w-3xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Privacy & Academic Integrity</h3>
        <p className="text-muted-foreground text-sm">
          Finalyzed strictly anonymizes all institutional data. Student-specific private information (names, topics, files, or messages) is NEVER exposed in the Knowledge Base. This database exists solely to standardize formatting and structural expectations.
        </p>
      </div>
    </div>
  );
}
