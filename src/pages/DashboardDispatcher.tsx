import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import SpecialistDashboard from './SpecialistDashboard';
import EditorDashboard from './EditorDashboard';
import AdminDashboard from './AdminDashboard';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, Briefcase, ShieldCheck } from 'lucide-react';

const SUPER_ADMIN_EMAILS = [
  'johnrufai242@gmail.com',
  'rufaijohnny@gmail.com'
];

export default function DashboardDispatcher() {
  const { user, userData } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check super admin status based on email
  if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
    return <AdminDashboard />;
  }

  if (userData?.role === 'specialist') {
    return <SpecialistDashboard />;
  }
  
  if (userData?.role === 'editor') {
    return <EditorDashboard />;
  }

  if (userData?.role === 'student') {
    return <StudentDashboard />;
  }

  // If userData is completely null (no document exists), show Onboarding
  if (!userData) {
    const handleSelectRole = async (role: string) => {
      setSaving(true);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'Unknown User',
          email: user.email,
          role: role,
          createdAt: serverTimestamp(),
        });
        // Reload page to reflect new auth state and role
        window.location.reload();
      } catch (err) {
        console.error('Failed to save role', err);
        setSaving(false);
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-light tracking-tight mb-4">
          Welcome to <span className="font-bold">FINALYZED</span>
        </h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Please select how you intend to use the platform. This will customize your dashboard and workflow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <button 
            onClick={() => handleSelectRole('student')}
            disabled={saving}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Student</h3>
            <p className="text-sm text-muted-foreground text-center">
              I want to commission projects and find verified academic specialists.
            </p>
          </button>

          <button 
            onClick={() => handleSelectRole('specialist')}
            disabled={saving}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Specialist</h3>
            <p className="text-sm text-muted-foreground text-center">
              I am a writer looking to accept commissions and earn money.
            </p>
          </button>

          <button 
            onClick={() => handleSelectRole('editor')}
            disabled={saving}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Editor</h3>
            <p className="text-sm text-muted-foreground text-center">
              I want to provide quality assurance and review submitted projects.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return <StudentDashboard />;
}

