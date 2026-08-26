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

  if (!userData) {
    return <Navigate to="/onboarding" replace />;
  }

  return <StudentDashboard />;
}

