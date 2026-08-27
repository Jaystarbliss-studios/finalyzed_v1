import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Wallet, CheckCircle, ChevronRight, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { collection, query, where, getDocs, orderBy } from '../lib/supabaseCompat';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const earningsData = [
  { name: 'Week 1', earnings: 450, clearance: 200 },
  { name: 'Week 2', earnings: 300, clearance: 300 },
  { name: 'Week 3', earnings: 600, clearance: 400 },
  { name: 'Week 4', earnings: 800, clearance: 600 },
];

export default function SpecialistDashboard() {
  const { user, userData } = useAuth();
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'projects'),
          where('specialistId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveProjects(projects);
      } catch (err) {
        console.error("Error fetching projects", err);
        // Fallback for demo
        setActiveProjects([
          { id: '1', title: 'Macroeconomics Final Essay', status: 'in-progress', deadline: '24 hours' },
          { id: '2', title: 'Machine Learning Research Paper', status: 'review', deadline: '3 days' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <header className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <span className="mono-label">Specialist Portal</span>
          <h1 className="text-3xl font-light tracking-tight mt-2">
            WELCOME, <span className="font-bold">{userData?.name?.split(' ')[0] || 'SPECIALIST'}</span>
          </h1>
        </div>
        <Link to="/wallet" className="btn-secondary px-4 py-2 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>My Wallet</span>
        </Link>
      </header>

      {/* Specialist Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Available Balance
          </div>
          <div className="text-3xl font-bold text-foreground">$1,250.00</div>
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +$450 this week
          </div>
        </div>
        
        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Clearance
          </div>
          <div className="text-3xl font-bold text-foreground">$340.00</div>
          <div className="mt-2 text-xs text-muted-foreground">From 3 active projects</div>
        </div>

        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> QA Approval Rate
          </div>
          <div className="text-3xl font-bold text-foreground">98.5%</div>
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top 5% Specialist
          </div>
        </div>

        <div className="bento-card p-6 bg-primary/5 border-primary/20">
          <div className="text-primary text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Finalyzed Points
          </div>
          <div className="text-3xl font-bold text-primary">2,450</div>
          <div className="mt-2 text-xs text-primary/80">Convertible to tier boosts</div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bento-card p-6 mt-4">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" /> Earnings & Clearance History
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
              />
              <Bar dataKey="earnings" fill="#337179" radius={[4, 4, 0, 0]} name="Total Earnings" />
              <Bar dataKey="clearance" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Pending Clearance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Work Queue */}
      <div className="bento-card p-0 overflow-hidden mt-4">
        <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Active Work Queue
          </h2>
          <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {activeProjects.length} Active
          </span>
        </div>
        
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading queue...</div>
          ) : activeProjects.length > 0 ? (
            activeProjects.map((project, i) => (
              <div key={project.id || i} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{project.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due in {project.deadline || '2 days'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        project.status === 'in-progress' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'
                      }`}>
                        {project.status === 'in-progress' ? 'Needs Drafting' : 'Editor Reviewing'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/workspace/${project.id || 'demo'}`} className="btn-secondary px-4 py-2 flex items-center gap-2">
                    Open Workspace
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Queue is empty</h3>
              <p className="text-sm text-muted-foreground">You have no active projects assigned.</p>
              <Link to="/marketplace" className="btn-secondary mt-6 px-4 py-2 text-sm">
                Browse Marketplace Opportunities
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
