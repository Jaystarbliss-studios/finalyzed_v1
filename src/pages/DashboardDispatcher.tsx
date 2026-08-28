import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import SpecialistDashboard from './SpecialistDashboard';
import EditorDashboard from './EditorDashboard';
import AdminDashboard from './AdminDashboard';
import { Clock3, ShieldCheck, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUPER_ADMIN_EMAILS = ['johnrufai242@gmail.com', 'rufaijohnny@gmail.com'];

export default function DashboardDispatcher() {
  const { user, userData } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (userData?.role === 'admin') return <AdminDashboard />;
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) return <AdminDashboard />;

  // A newly registered writer/editor is deliberately represented as a pending
  // application rather than receiving a privileged dashboard immediately.
  if (userData?.status === 'PENDING_REVIEW' && userData.pendingCapability) {
    return <PendingCapability capability={String(userData.pendingCapability)} />;
  }

  if (!userData) return <Navigate to="/onboarding" replace />;
  if (!userData.onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (userData.status === 'PENDING_REVIEW' && (userData.role === 'writer' || userData.role === 'editor')) return <PendingCapability capability={userData.role} />;
  if (userData.role === 'writer' || userData.role === 'specialist') return <SpecialistDashboard />;
  if (userData.role === 'editor') return <EditorDashboard />;
  return <StudentDashboard />;
}

function PendingCapability({ capability }: { capability: string }) {
  const isEditor = capability === 'editor';
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bento-card max-w-xl w-full p-7 md:p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          {isEditor ? <ShieldCheck className="w-8 h-8 text-primary" /> : <Briefcase className="w-8 h-8 text-primary" />}
        </div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Application received</p>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">Your {isEditor ? 'Project Manager' : 'Project Writer'} application is under review</h1>
        <p className="text-muted-foreground mt-4 leading-relaxed">Finalyzed will review your submitted information before activating this capability. Project Managers handle quality assurance and revision oversight. You cannot accept projects or perform quality assurance until approval.</p>
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 flex items-center gap-3 text-left"><Clock3 className="w-5 h-5 text-primary shrink-0" /><div><p className="text-sm font-semibold">Status: Pending review</p><p className="text-xs text-muted-foreground mt-0.5">You’ll be notified when your application is approved.</p></div></div>
        <Link to="/" className="btn-secondary inline-flex items-center gap-2 mt-7">Return to Finalyzed <ArrowRight className="w-4 h-4" /></Link>
      </div>
    </div>
  );
}
