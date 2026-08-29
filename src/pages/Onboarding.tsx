import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import InstitutionPicker from '../components/InstitutionPicker';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { GraduationCap, Briefcase, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

type RegistrationRole = 'student' | 'specialist' | 'editor';
const roleMeta = {
  student: { title: 'Student', icon: GraduationCap, description: 'Find project specialists and commission academic project support.' },
  specialist: { title: 'Project Writer', icon: Briefcase, description: 'Provide research, project-writing, formatting and technical project services.' },
  editor: { title: 'Project Manager', icon: ShieldCheck, description: 'Review completed projects and provide independent quality assurance.' },
};

export default function Onboarding() {
  const { user, userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<RegistrationRole | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ fullName:'', username:'', phone:'', institution:'', faculty:'', department:'', degree:'', matricNumber:'', graduationYear:'', bio:'', expertise:'', availability:'', availabilityDays:[] as string[], schoolLevels:[] as string[], portfolio:'' });

  if (!user) return <Navigate to="/login" replace />;
  if (userData?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (userData?.onboardingComplete) return <Navigate to="/dashboard" replace />;
  const update = (name:string,value:string) => setFormData(prev=>({...prev,[name]:value}));

  const handleComplete = async (event:React.FormEvent) => {
    event.preventDefault(); if (!role) return; setSaving(true); setError('');
    try {
      const fullName = formData.fullName.trim() || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Finalyzed User';
      const username = formData.username.trim().toLowerCase();
      const specialties = formData.expertise.split(',').map(v => v.trim()).filter(Boolean);
      let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      if (avatarFile) avatarUrl = await uploadImageToCloudinary(avatarFile);
      const { error: onboardingError } = await supabase.rpc('complete_onboarding', {
        p_role: role === 'specialist' ? 'writer' : role,
        p_full_name: fullName,
        p_username: username || null,
        p_avatar_url: avatarUrl,
        p_phone: formData.phone.trim(),
        p_institution: formData.institution.trim(),
        p_faculty: formData.faculty.trim(),
        p_department: formData.department.trim(),
        p_degree: formData.degree.trim(),
        p_matric_number: formData.matricNumber.trim(),
        p_graduation_year: formData.graduationYear.trim(),
        p_bio: formData.bio.trim(),
        p_specialties: specialties,
        p_portfolio_url: formData.portfolio.trim(),
        p_availability_days: formData.availabilityDays,
        p_availability_hours: formData.availability,
        p_school_levels: formData.schoolLevels,
      });
      if (onboardingError) throw onboardingError;
      await refreshUserData();
      navigate('/dashboard', { replace:true, state:{ onboardingComplete:true, pendingCapability:role !== 'student' ? role : undefined } });
    } catch (err:any) {
      console.error('Finalyzed onboarding failed:',err);
      const message = err?.message || '';
      setError(message.includes('USERNAME_TAKEN') ? 'That username is already in use. Please choose another.' : message.includes('INVALID_USERNAME') ? 'Username must be 3–30 characters and use only letters, numbers, dots, hyphens or underscores.' : 'We could not complete your registration. Please try again.');
    } finally { setSaving(false); }
  };

  const meta = role ? roleMeta[role] : null;
  return <div className="w-full max-w-5xl mx-auto px-4 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:py-10 md:py-16 min-h-[100dvh]">
    <div className="text-center mb-8 md:mb-10"><p className="text-xs font-bold tracking-[0.22em] uppercase text-primary mb-3">First-time setup</p><h1 className="text-3xl md:text-4xl font-light tracking-tight">Welcome to <span className="font-bold">FINALYZED</span></h1><p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Tell us how you intend to use Finalyzed. Your selection determines the information and verification steps we request.</p></div>
    <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">{[1,2].map(item=><div key={item} className={`h-1.5 rounded-full transition-all ${step>=item?'w-16 bg-primary':'w-8 bg-border'}`} />)}</div>
    {error && <div role="alert" className="max-w-3xl mx-auto mb-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 p-4 text-sm">{error}</div>}
    {step===1 && <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{(Object.keys(roleMeta) as RegistrationRole[]).map(item=>{const Icon=roleMeta[item].icon; const selected=role===item; return <motion.button type="button" key={item} whileHover={{y:-3}} whileTap={{scale:.99}} onClick={()=>setRole(item)} className={`bento-card p-7 text-left transition-all border-2 ${selected?'border-primary bg-primary/5 shadow-lg shadow-primary/10':'border-transparent hover:border-primary/30'}`}><div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Icon className="w-7 h-7 text-primary"/></div>{selected&&<CheckCircle2 className="w-5 h-5 text-primary"/>}</div><h2 className="text-xl font-bold mt-6">{roleMeta[item].title}</h2><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{roleMeta[item].description}</p></motion.button>})}<div className="md:col-span-3 flex justify-center mt-3"><button type="button" disabled={!role} onClick={()=>setStep(2)} className="btn-primary px-7 py-3 flex items-center gap-2 disabled:opacity-40">Continue <ArrowRight className="w-4 h-4"/></button></div></div>}
    {step===2 && meta && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="bento-card p-6 md:p-8 max-w-3xl mx-auto"><button type="button" onClick={()=>setStep(1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4"/> Change role</button><div className="flex items-center gap-4 mb-7"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><meta.icon className="w-6 h-6 text-primary"/></div><div><p className="text-xs uppercase tracking-wider font-bold text-primary">Registration</p><h2 className="text-2xl font-bold">{meta.title}</h2></div></div>
      <form onSubmit={handleComplete} className="space-y-5 pb-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Full Name" name="fullName" value={formData.fullName} onChange={update} required placeholder="Your legal/full name"/><Field label="Username" name="username" value={formData.username} onChange={update} required placeholder="e.g. johnwrites"/></div><p className="-mt-2 text-xs text-muted-foreground">Your full name is used for official records and administrator review. Every account has a unique public username that students and other users can see.</p><label className="block space-y-2"><span className="text-sm font-medium">Profile photo (optional)</span><input type="file" accept="image/*" onChange={e=>setAvatarFile(e.target.files?.[0]||null)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm"/><span className="text-xs text-muted-foreground">PNG/JPG/WebP, maximum 5 MB. Uploaded securely to Cloudinary.</span></label><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Phone Number" name="phone" value={formData.phone} onChange={update} type="tel" required/><InstitutionPicker value={formData.institution} onChange={v=>update('institution',v)} required/></div>
      {role==='student'?<><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Faculty / School" name="faculty" value={formData.faculty} onChange={update} required/><Field label="Department" name="department" value={formData.department} onChange={update} required/></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Field label="Degree / Award" name="degree" value={formData.degree} onChange={update} required/><Field label="Matriculation / Registration No." name="matricNumber" value={formData.matricNumber} onChange={update} required/><Field label="Graduation Year" name="graduationYear" value={formData.graduationYear} onChange={update} required/></div></>:<><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Highest Degree / Qualification" name="degree" value={formData.degree} onChange={update} required/><Field label="Discipline / Department" name="department" value={formData.department} onChange={update} required/></div><div className="space-y-2"><span className="text-sm font-medium">School levels served</span><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{['ND/HND','Undergraduate','Masters','Doctorate'].map(level=><label key={level} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm cursor-pointer"><input type="checkbox" checked={formData.schoolLevels.includes(level)} onChange={e=>update('schoolLevels',e.target.checked?[...formData.schoolLevels,level]:formData.schoolLevels.filter(x=>x!==level))}/>{level}</label>)}</div></div><Field label="Areas of Expertise (comma separated)" name="expertise" value={formData.expertise} onChange={update} placeholder="Software Engineering, Data Analysis, APA, Engineering Design" required/><Field label="Professional Biography" name="bio" value={formData.bio} onChange={update} textarea required placeholder="Tell students/admins about your experience and strengths."/><div className="space-y-2"><span className="text-sm font-medium">Available days</span><div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><label key={day} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm cursor-pointer"><input type="checkbox" checked={formData.availabilityDays.includes(day)} onChange={e=>update('availabilityDays',e.target.checked?[...formData.availabilityDays,day]:formData.availabilityDays.filter(x=>x!==day))}/>{day}</label>)}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="block space-y-2"><span className="text-sm font-medium">Available hours</span><select value={formData.availability} onChange={e=>update('availability',e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3"><option value="">Select hours</option>{['1–2 hours/day','2–4 hours/day','4–6 hours/day','6–8 hours/day','8+ hours/day'].map(x=><option key={x}>{x}</option>)}</select></label><Field label="Portfolio Link (optional)" name="portfolio" value={formData.portfolio} onChange={update} placeholder="https://…"/></div><div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">Your {meta.title.toLowerCase()} capability will remain <strong className="text-foreground">pending approval</strong>. You will not be able to accept projects or perform QA until Finalyzed verifies the application.</div></>}
      <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">{saving?'Saving your registration…':'Complete Registration'}{!saving&&<ArrowRight className="w-4 h-4"/>}</button></form></motion.div>}
  </div>;
}

function Field({label,name,value,onChange,type='text',required=false,textarea=false,placeholder=''}:{label:string;name:string;value:string;onChange:(name:string,value:string)=>void;type?:string;required?:boolean;textarea?:boolean;placeholder?:string}) {
 const common={name,value,required,placeholder,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(name,e.target.value),className:'w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'};
 return <label className="space-y-2 block"><span className="text-sm font-medium">{label}{required&&<span className="text-primary"> *</span>}</span>{textarea?<textarea {...common} className={`${common.className} min-h-[120px] resize-y`}/>:<input {...common} type={type}/>}</label>;
}
