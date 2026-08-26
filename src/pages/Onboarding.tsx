import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, Briefcase, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Onboarding() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    phone: '',
    institution: '',
    faculty: '',
    department: '',
    degree: '',
    matricNumber: '',
    graduationYear: '',
    bio: '',
    expertise: '',
    availability: '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  if (userData) {
    navigate('/dashboard');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const baseData = {
        name: user.displayName || 'Unknown User',
        email: user.email,
        phone: formData.phone,
        createdAt: serverTimestamp(),
      };

      if (role === 'student') {
        await setDoc(userRef, {
          ...baseData,
          role: 'student',
          status: 'ACTIVE',
          studentProfile: {
            institution: formData.institution,
            faculty: formData.faculty,
            department: formData.department,
            degree: formData.degree,
            matricNumber: formData.matricNumber,
            graduationYear: formData.graduationYear,
          }
        });
      } else if (role === 'specialist') {
        // Specialist applications start as pending review
        await setDoc(userRef, {
          ...baseData,
          role: 'specialist',
          status: 'PENDING_REVIEW',
          specialistProfile: {
            institution: formData.institution,
            degree: formData.degree,
            department: formData.department,
            bio: formData.bio,
            expertise: formData.expertise,
            availability: formData.availability,
          }
        });
      } else if (role === 'editor') {
        // Editor applications start as pending review
        await setDoc(userRef, {
          ...baseData,
          role: 'editor',
          status: 'PENDING_REVIEW',
          editorProfile: {
            institution: formData.institution,
            degree: formData.degree,
            department: formData.department,
            bio: formData.bio,
            expertise: formData.expertise,
            availability: formData.availability,
          }
        });
      }

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light tracking-tight mb-4">
          Welcome to <span className="font-bold">FINALYZED</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {step === 1 ? 'How will you use Finalyzed?' : 'Complete your profile to get started.'}
        </p>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => { setRole('student'); setStep(2); }}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Student</h3>
            <p className="text-sm text-muted-foreground text-center">
              Find project specialists and commission academic project support.
            </p>
          </button>

          <button 
            onClick={() => { setRole('specialist'); setStep(2); }}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Project Writer</h3>
            <p className="text-sm text-muted-foreground text-center">
              Provide project-writing, research and academic project services.
            </p>
          </button>

          <button 
            onClick={() => { setRole('editor'); setStep(2); }}
            className="bento-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors group text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Editor</h3>
            <p className="text-sm text-muted-foreground text-center">
              Review completed projects and provide quality assurance.
            </p>
          </button>
        </div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bento-card p-8 max-w-2xl mx-auto">
          <button 
            onClick={() => setStep(1)} 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to roles
          </button>
          
          <h2 className="text-2xl font-bold mb-6 capitalize">{role} Registration</h2>
          
          <form onSubmit={handleComplete} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institution</label>
                <input required name="institution" value={formData.institution} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
              </div>
            </div>

            {role === 'student' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faculty / School</label>
                    <input required name="faculty" value={formData.faculty} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <input required name="department" value={formData.department} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Degree Program</label>
                    <input required name="degree" value={formData.degree} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Matriculation No.</label>
                    <input required name="matricNumber" value={formData.matricNumber} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Graduation Year</label>
                    <input required name="graduationYear" value={formData.graduationYear} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                </div>
              </>
            )}

            {(role === 'specialist' || role === 'editor') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Highest Degree</label>
                    <input required name="degree" value={formData.degree} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discipline / Department</label>
                    <input required name="department" value={formData.department} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Areas of Expertise (Comma separated)</label>
                  <input required name="expertise" value={formData.expertise} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" placeholder="e.g. Software Engineering, Data Analysis, APA Citation" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Professional Biography</label>
                  <textarea required name="bio" value={formData.bio} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 min-h-[100px]"></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Availability (Hours/Week)</label>
                  <input required name="availability" value={formData.availability} onChange={handleInputChange} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2" />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {saving ? 'Creating Profile...' : 'Complete Registration'}
              {!saving && <ArrowRight className="w-4 h-4" />}
            </button>
            
            {(role === 'specialist' || role === 'editor') && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Note: Your application will be reviewed by an administrator before your capabilities are activated.
              </p>
            )}
          </form>
        </motion.div>
      )}
    </div>
  );
}
