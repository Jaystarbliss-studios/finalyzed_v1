import React from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Clock, Plus, Search, ChevronRight, AlertCircle, CheckCircle, Activity as ActivityIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const activityData = [
  { name: 'Jan', projects: 1, points: 200 },
  { name: 'Feb', projects: 0, points: 150 },
  { name: 'Mar', projects: 2, points: 800 },
  { name: 'Apr', projects: 1, points: 400 },
  { name: 'May', projects: 3, points: 1200 },
  { name: 'Jun', projects: 2, points: 600 },
];

export default function StudentDashboard() {
  const location = useLocation();
  const paymentSuccess = location.state?.paymentSuccess;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {paymentSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <h4 className="font-bold text-sm">Payment Successful & Project Assigned!</h4>
            <p className="text-xs text-green-400/80">Your specialist will begin reviewing your project shortly.</p>
          </div>
        </div>
      )}
      <header className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <span className="mono-label">Student Portal</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-2 h-6 bg-primary"></div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              DASHBOARD.<span className="opacity-50 font-light">OVERVIEW</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="mono-label">User ID</span>
            <span className="text-foreground text-sm">STU-88AF-02X</span>
          </div>
          <div className="badge-verified">
            <div className="w-1.5 h-1.5 rounded-full bg-primary "></div>
            System Live
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-5">
        
        {/* Welcome & Quick Actions */}
        <div className="md:col-span-8 md:row-span-2 bento-card p-8 flex flex-col justify-between">
          <div className="bento-glow"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="mono-label mb-2">Welcome Back</p>
              <h2 className="text-3xl font-light text-foreground tracking-tight">John Doe</h2>
              <p className="text-muted-foreground mt-2 max-w-md">Your project "Quantum Computing Applications in Financial Modeling" is currently under editor review.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/specialists" className="btn-secondary px-4 py-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Find Specialist
              </Link>
              <Link to="/start-project" className="btn-primary px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            </div>
          </div>
        </div>

        {/* Finalyzed Points */}
        <div className="md:col-span-4 md:row-span-2 bento-card p-6 flex flex-col justify-between items-center text-center">
          <div>
            <span className="mono-label">Finalyzed Points</span>
          </div>
          <div className="flex flex-col items-center gap-1 my-4">
            <span className="text-5xl font-light text-foreground tracking-tighter">1,250</span>
            <span className="mono-label text-[10px]">Available Balance</span>
          </div>
          <div className="w-full h-8 flex items-center justify-center gap-1 opacity-80">
            <div className="w-1 h-3 bg-white/10 rounded-full"></div>
            <div className="w-1 h-5 bg-white/20 rounded-full"></div>
            <div className="w-1 h-8 bg-primary rounded-full "></div>
            <div className="w-1 h-6 bg-white/20 rounded-full"></div>
            <div className="w-1 h-4 bg-white/10 rounded-full"></div>
          </div>
          <button className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2 hover:underline">
            Buy Points →
          </button>
        </div>

        {/* Active Projects */}
        <div className="md:col-span-8 md:row-span-4 bento-card p-8">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <span className="mono-label">Active Projects</span>
            <span className="badge-verified bg-primary/10 border-primary/20 text-primary">1 Active</span>
          </div>
          
          <div className="space-y-6">
            {/* Project Item */}
            <div className="group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">Quantum Computing in Finance</h3>
                  <p className="text-sm text-muted-foreground mt-1">Specialist: Dr. Jane Doe • Premium Plan</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">EDITOR_REVIEWING</span>
                </div>
              </div>
              
              {/* Timeline component */}
              <div className="relative pt-6 pb-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 rounded-full"></div>
                <div className="absolute top-1/2 left-0 w-[60%] h-0.5 bg-primary -translate-y-1/2 rounded-full "></div>
                
                <div className="relative z-10 flex justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary "></div>
                    <span className="text-[9px] font-mono text-primary uppercase">Spec</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary "></div>
                    <span className="text-[9px] font-mono text-primary uppercase">Paid</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary "></div>
                    <span className="text-[9px] font-mono text-primary uppercase">Work</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary bg-background"></div>
                    <span className="text-[9px] font-mono text-primary uppercase">QA</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 bg-background"></div>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Upcoming Deadlines */}
        <div className="md:col-span-4 md:row-span-4 flex flex-col gap-5">
          <div className="flex-1 bento-card p-6">
            <span className="mono-label mb-4 block">System Logs / Notifications</span>
            <div className="space-y-4">
              <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-foreground block mb-1">Specialist submitted draft</span>
                    <span className="text-muted-foreground text-[10px]">Project moved to QA stage</span>
                  </div>
                </div>
                <span className="text-muted-foreground font-mono">2h ago</span>
              </div>
              <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <span className="text-foreground block mb-1">Payment Confirmed</span>
                    <span className="text-muted-foreground text-[10px]">Ref: PAY-992-AX</span>
                  </div>
                </div>
                <span className="text-muted-foreground font-mono">3d ago</span>
              </div>
              <div className="flex justify-between items-start text-xs">
                <div className="flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-foreground block mb-1">Specification Required</span>
                    <span className="text-muted-foreground text-[10px]">Draft project #402 missing details</span>
                  </div>
                </div>
                <span className="text-muted-foreground font-mono">5d ago</span>
              </div>
            </div>
          </div>

          <div className="bento-card p-6 bg-primary/5 border-primary/20">
            <div className="flex justify-between items-center mb-4">
               <span className="mono-label text-primary">Deadline Matrix</span>
               <Clock className="w-4 h-4 text-primary opacity-50" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-[4px] border-white/5 border-t-primary relative flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">3</span>
                <span className="absolute bottom-1 text-[8px] text-muted-foreground uppercase">Days</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">Quantum Computing Draft</h4>
                <p className="text-xs text-muted-foreground mt-1">Expected completion of QA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Overview Chart */}
        <div className="md:col-span-12 bento-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="mono-label flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-primary" /> Activity Overview
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#337179" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#337179" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="points" stroke="#337179" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
