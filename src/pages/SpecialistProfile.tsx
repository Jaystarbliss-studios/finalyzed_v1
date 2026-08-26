import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Star, ShieldCheck, CheckCircle, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export default function SpecialistProfile() {
  const { id } = useParams<{ id: string }>();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialist = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSpecialist({ id: docSnap.id, ...docSnap.data() } as any);
        } else {
          setSpecialist(null);
        }
      } catch (err) {
        console.error("Failed to fetch specialist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialist();
  }, [id]);

  if (loading) {
    return <div className="w-full p-8 text-center"><span className="mono-label">Loading Profile Matrix...</span></div>;
  }

  if (!specialist) {
    return (
      <div className="w-full p-8 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Specialist Not Found</h2>
        <Link to="/specialists" className="btn-secondary px-6 py-2">Return to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <Link to="/specialists" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium self-start mb-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Identity & CTA */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bento-card p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl">
                {specialist.imageUrl ? (
                  <img src={specialist.imageUrl} alt={specialist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10" />
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{specialist.name}</h1>
                  {specialist.isVerified && (
                    <div className="badge-verified bg-primary/10 border-primary/20 text-primary">
                      <ShieldCheck className="w-4 h-4" />
                      Finalyzed Verified
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground text-lg mb-6">Professional Academic Consultant & Writer</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {specialist.specialties.map(spec => (
                    <span key={spec} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <Link to="/start-project" className="btn-primary px-8 py-3 text-center text-lg flex-1 md:flex-none">
                    Commission Specialist
                  </Link>
                  <button className="btn-secondary px-8 py-3 text-center text-lg flex-1 md:flex-none">
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* About / Portfolio Placeholder */}
          <div className="bento-card p-8">
            <span className="mono-label mb-6 block">Biography & Expertise</span>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                A highly experienced academic writer and researcher specializing in {specialist.specialties.join(", ")}. 
                I have a strong track record of delivering meticulously researched, perfectly formatted projects that pass 
                strict QA standards.
              </p>
              <p>
                My methodology relies on deep literature review, robust data analysis, and adherence to specific institutional requirements. 
                I am highly familiar with IEEE, APA, and Harvard citation styles, and have successfully completed {specialist.completedProjects} projects on the Finalyzed platform.
              </p>
            </div>

            <div className="mt-8 border-t border-white/5 pt-8">
              <span className="mono-label mb-6 block">Supported Institutions</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-background p-4 rounded-xl border border-border">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">University of Technology</span>
                </div>
                <div className="flex items-center gap-3 bg-background p-4 rounded-xl border border-border">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">National Science Academy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bento-card p-6">
            <span className="mono-label mb-6 block">Performance Metrics</span>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary fill-current" />
                  </div>
                  <div>
                    <span className="block text-foreground font-bold text-lg leading-none">{specialist.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{specialist.reviews} Reviews</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary">Top 5%</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <span className="block text-foreground font-bold text-lg leading-none">{specialist.approvalRate}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">QA Approval</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="block text-foreground font-bold text-lg leading-none">{specialist.averageDeliveryDays} Days</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Avg Delivery</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="block text-foreground font-bold text-lg leading-none">{specialist.completedProjects}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-card p-6 bg-primary/5 border-primary/20">
            <span className="mono-label mb-4 block text-primary">Availability Status</span>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </div>
              <span className="text-foreground font-bold text-sm">Accepting New Projects</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">This specialist currently has capacity for 2 more active projects this week.</p>
            
            <Link 
              to="/checkout" 
              state={{ project: { title: `Editorial Review with ${specialist.name}`, type: 'Commissioned Project' } }}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 group"
            >
              Commission Specialist
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
