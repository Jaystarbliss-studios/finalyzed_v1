import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle, ChevronRight, AlertCircle, TrendingUp, XCircle, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { collection, query, where, getDocs, orderBy } from '../lib/supabaseCompat';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const reviewData = [
  { name: 'Mon', approvals: 5, revisions: 1 },
  { name: 'Tue', approvals: 8, revisions: 2 },
  { name: 'Wed', approvals: 12, revisions: 3 },
  { name: 'Thu', approvals: 7, revisions: 0 },
  { name: 'Fri', approvals: 14, revisions: 4 },
  { name: 'Sat', approvals: 9, revisions: 1 },
  { name: 'Sun', approvals: 4, revisions: 0 },
];

export default function EditorDashboard() {
  const { user, userData } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'projects'),
          where('status', '==', 'EDITOR_REVIEWING')
        );
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingReviews(reviews);
      } catch (err) {
        console.error("Error fetching reviews", err);
        // Fallback for demo
        setPendingReviews([
          { id: '1', title: 'Macroeconomics Final Essay', specialist: 'Dr. Sarah Jenkins', timeInReview: '2 hours' },
          { id: '2', title: 'Machine Learning Research Paper', specialist: 'Prof. David Chen', timeInReview: '5 hours' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <header className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <span className="mono-label text-primary">Editor Portal</span>
          <h1 className="text-3xl font-light tracking-tight mt-2">
            WELCOME, <span className="font-bold">{userData?.name?.split(' ')[0] || 'EDITOR'}</span>
          </h1>
        </div>
      </header>

      {/* Editor Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" /> Approvals Today
          </div>
          <div className="text-3xl font-bold text-foreground">14</div>
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2 from yesterday
          </div>
        </div>
        
        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" /> Revision Requests
          </div>
          <div className="text-3xl font-bold text-foreground">3</div>
          <div className="mt-2 text-xs text-muted-foreground">Sent back to specialists</div>
        </div>

        <div className="bento-card p-6">
          <div className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" /> Avg Review Time
          </div>
          <div className="text-3xl font-bold text-foreground">18m</div>
          <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top 10% Speed
          </div>
        </div>

        <div className="bento-card p-6 bg-primary/5 border-primary/20">
          <div className="text-primary text-sm font-medium mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Finalyzed Points Earned
          </div>
          <div className="text-3xl font-bold text-primary">1,200</div>
          <div className="mt-2 text-xs text-primary/80">From QA bounties</div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bento-card p-6 mt-4">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Review Activity History
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reviewData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
              />
              <Line type="monotone" dataKey="approvals" stroke="#4ade80" strokeWidth={3} dot={{ fill: '#4ade80', strokeWidth: 2, r: 4 }} name="Approvals" />
              <Line type="monotone" dataKey="revisions" stroke="#f87171" strokeWidth={3} dot={{ fill: '#f87171', strokeWidth: 2, r: 4 }} name="Revisions Requested" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QA Review Queue */}
      <div className="bento-card p-0 overflow-hidden mt-4">
        <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Global QA Queue
          </h2>
          <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {pendingReviews.length} Pending
          </span>
        </div>
        
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading queue...</div>
          ) : pendingReviews.length > 0 ? (
            pendingReviews.map((review, i) => (
              <div key={review.id || i} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{review.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Specialist: {review.specialist}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/5">
                        Waiting {review.timeInReview}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/qa-workspace/${review.id || 'demo'}`} className="btn-primary bg-primary hover:bg-primary-dark text-white px-4 py-2 flex items-center gap-2 ">
                    Start QA Review
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-green-400/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Queue is clear!</h3>
              <p className="text-sm text-muted-foreground">All submitted projects have been reviewed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
