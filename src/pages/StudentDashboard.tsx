import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, BookOpen, Clock, Zap, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { collection, query, where, getDocs, orderBy } from '../lib/supabaseCompat';

export default function StudentDashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const q = query(collection(db, 'projects'), where('studentId', '==', user.uid));
          const snapshot = await getDocs(q);
          const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // sort locally by date since we don't have a composite index guaranteed yet
          pData.sort((a, b) => (b as any).createdAt?.toMillis() - (a as any).createdAt?.toMillis());
          setProjects(pData);
        } catch (error) {
          console.error("Error fetching projects", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [user]);

  const activeProjects = projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col h-full gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
        <div className="flex flex-col">
          <span className="mono-label">Student Portal</span>
          <h1 className="text-3xl font-light tracking-tight text-foreground mt-2">
            Welcome back, <span className="font-bold">{userData?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
        </div>
        <Link to="/start-project" className="btn-primary px-6 py-2 flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 md:gap-5">
        
        {/* Quick Stats Column */}
        <div className="md:col-span-4 md:row-span-6 flex flex-col gap-4 md:gap-5">
          {/* Finalyzed Points */}
          <div className="bento-card p-6 md:p-8 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1 my-4">
              <span className="text-4xl md:text-5xl font-light text-foreground tracking-tighter">{(userData?.walletBalance || 0).toLocaleString()}</span>
              <span className="mono-label text-[10px]">Available Points</span>
            </div>
            <button className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2 hover:underline">
              Buy Points →
            </button>
          </div>

          <div className="bento-card p-6 md:p-8 flex-1 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="mono-label">Account Status</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Profile</span>
                <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Complete</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Institution</span>
                <span className="text-foreground font-medium truncate max-w-[150px]">{userData?.studentProfile?.institution || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="md:col-span-8 md:row-span-4 bento-card p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-border pb-4">
            <span className="mono-label">Active Projects</span>
            <span className="badge-verified bg-primary/10 border-primary/20 text-primary">{activeProjects.length} Active</span>
          </div>
          
          <div className="space-y-6">
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No active projects found.</p>
                <Link to="/specialists" className="text-primary hover:underline text-sm font-medium mt-2 inline-block">Find a Specialist to get started</Link>
              </div>
            ) : (
              activeProjects.map(project => (
                <Link to={`/workspace/${project.id}`} key={project.id} className="group block p-4 -mx-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">Specialist: {project.specialistId === 'unassigned' ? 'Awaiting Assignment' : project.specialistId} • {project.plan} Plan</p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">{project.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  
                  {/* Pseudo Timeline */}
                  <div className="relative pt-6 pb-2 hidden md:block">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 rounded-full"></div>
                    <div className="relative flex justify-between">
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Spec</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                        <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Paid</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-3 h-3 rounded-full ${project.specialistId !== 'unassigned' ? 'bg-primary' : 'bg-muted-foreground/30'} ring-4 ring-background`}></div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Writer</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-3 h-3 rounded-full ${['EDITOR_REVIEWING', 'AVAILABLE_TO_STUDENT'].includes(project.status) ? 'bg-primary' : 'bg-muted-foreground/30'} ring-4 ring-background`}></div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Editor</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30 ring-4 ring-background"></div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Done</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Project History */}
        <div className="md:col-span-8 md:row-span-2 bento-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="mono-label flex items-center gap-2"><Clock className="w-3 h-3" /> Project History</span>
            <Link to="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">View All</Link>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {completedProjects.length === 0 ? (
              <span className="text-sm text-muted-foreground">No completed projects yet.</span>
            ) : (
              <div className="w-full space-y-2">
                {completedProjects.slice(0, 2).map(project => (
                  <div key={project.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                    <span className="text-foreground font-medium">{project.title}</span>
                    <span className="text-muted-foreground capitalize">{project.plan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
