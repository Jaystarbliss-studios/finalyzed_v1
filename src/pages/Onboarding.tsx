import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GraduationCap, Briefcase, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

type RegistrationRole = 'student' | 'specialist' | 'editor';
const roleMeta = {
  student: { title: 'Student', icon: GraduationCap, description: 'Find project specialists and commission academic project support.' },
  specialist: { title: 'Project Writer', icon: Briefcase, description: 'Provide research, project-writing, formatting and technical project services.' },
  editor: { title: 'Editor', icon: ShieldCheck, description: 'Review completed projects and provide independent quality assurance.' },
};

export default function Onboarding() {
  const { user, userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<RegistrationRole | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ phone:'', institution:'', faculty:'', department:'', degree:'', matricNumber:'', graduationYear:'', bio:'', expertise:'', availability:'', portfolio:'' });

  if (!user) { navigate('/login', { replace:true }); return null; }
  if (userData?.onboardingComplete) { navigate('/dashboard', { replace:true }); return null; }
  const update = (name:string,value:string) => setFormData(prev=>({...prev,[name]:value}));

  const handleComplete = async (event:React.FormEvent) => {
    event.preventDefault(); if (!role) return; setSaving(true); setError('');
    try {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Finalyzed User';
      const { error: profileError } = await supabase.from('profiles').upsert({ id:user.id, full_name:fullName, avatar_url:user.user_metadata?.avatar_url || user.user_metadata?.picture || null, role:'student', account_status:'approved' }, { onConflict:'id' });
      if (profileError) throw profileError;

      if (role === 'student') {
        const { error } = await supabase.from('student_profiles').upsert({ user_id:user.id, phone:formData.phone.trim(), institution:formData.institution.trim(), faculty:formData.faculty.trim(), department:formData.department.trim(), degree:formData.degree.trim(), matric_number:formData.matricNumber.trim(), graduation_year:formData.graduationYear.trim() }, { onConflict:'user_id' });
        if (error) throw error;
      } else {
        const table = role === 'specialist' ? 'writer_applications' : 'editor_applications';
        const payload = role === 'specialist'
          ? { user_id:user.id, status:'pending' as const, bio:formData.bio.trim(), specialties:formData.expertise.split(',').map(v=>v.trim()).filter(Boolean), academic_qualifications:formData.degree.trim(), portfolio_url:formData.portfolio.trim() || null }
          : { user_id:user.id, status:'pending' as const, bio:formData.bio.trim(), specialties:formData.expertise.split(',').map(v=>v.trim()).filter(Boolean), qualifications:formData.degree.trim() };
        const { error } = await supabase.from(table).upsert(payload, { onConflict:'user_id' });
        if (error) throw error;
      }
      await refreshUserData();
      navigate('/dashboard', { replace:true, state:{ onboardingComplete:true, pendingCapability:role !== 'student' ? role : undefined } });
    } catch (err:any) { console.error('Finalyzed onboarding failed:',err); setError(err?.message || 'We could not complete your registration. Please try again.'); }
    finally { setSaving(false); }
  };

  const meta = role ? roleMeta[role] : null;
  return <div className="w-full max-w-5xl mx-auto px-4 py-10 md:py-16">
    <div className="text-center mb-10"><p className="text-xs font-bold tracking-[0.22em] uppercase text-primary mb-3">First-time setup</p><h1 className="text-3xl md:text-4xl font-light tracking-tight">Welcome to <span className="font-bold">FINALYZED</span></h1><p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Tell us how you intend to use Finalyzed. Your selection determines the information and verification steps we request.</p></div>
    <div className="flex items-center justify-center gap-3 mb-8">{[1,2].map(item=><div key={item} className={`h-1.5 rounded-full transition-all ${step>=item?'w-16 bg-primary':'w-8 bg-border'}`} />)}</div>
    {error && <div role="alert" className="max-w-3xl mx-auto mb-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 p-4 text-sm">{error}</div>}
    {step===1 && <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{(Object.keys(roleMeta) as RegistrationRole[]).map(item=>{const Icon=roleMeta[item].icon; const selected=role===item; return <motion.button key={item} whileHover={{y:-3}} whileTap={{scale:.99}} onClick={()=>setRole(item)} className={`bento-card p-7 text-left transition-all border-2 ${selected?'border-primary bg-primary/5 shadow-lg shadow-primary/10':'border-transparent hover:border-primary/30'}`}><div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Icon className="w-7 h-7 text-primary"/></div>{selected&&<CheckCircle2 className="w-5 h-5 text-primary"/>}</div><h2 className="text-xl font-bold mt-6">{roleMeta[item].title}</h2><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{roleMeta[item].description}</p></motion.button>})}<div className="md:col-span-3 flex justify-center mt-3"><button disabled={!role} onClick={()=>setStep(2)} className="btn-primary px-7 py-3 flex items-center gap-2 disabled:opacity-40">Continue <ArrowRight className="w-4 h-4"/></button></div></div>}
    {step===2 && meta && <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="bento-card p-6 md:p-8 max-w-3xl mx-auto"><button onClick={()=>setStep(1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4"/> Change role</button><div className="flex items-center gap-4 mb-7"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><meta.icon className="w-6 h-6 text-primary"/></div><div><p className="text-xs uppercase tracking-wider font-bold text-primary">Registration</p><h2 className="text-2xl font-bold">{meta.title}</h2></div></div>
      <form onSubmit={handleComplete} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Phone Number" name="phone" value={formData.phone} onChange={update} type="tel" required/><Field label="Institution" name="institution" value={formData.institution} onChange={update} required/></div>
      {role==='student'?<><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Faculty / School" name="faculty" value={formData.faculty} onChange={update} required/><Field label="Department" name="department" value={formData.department} onChange={update} required/></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Field label="Degree / Award" name="degree" value={formData.degree} onChange={update} required/><Field label="Matriculation / Registration No." name="matricNumber" value={formData.matricNumber} onChange={update} required/><Field label="Graduation Year" name="graduationYear" value={formData.graduationYear} onChange={update} required/></div></>:<><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Highest Degree / Qualification" name="degree" value={formData.degree} onChange={update} required/><Field label="Discipline / Department" name="department" value={formData.department} onChange={update} required/></div><Field label="Areas of Expertise (comma separated)" name="expertise" value={formData.expertise} onChange={update} placeholder="Software Engineering, Data Analysis, APA, Engineering Design" required/><Field label="Professional Biography" name="bio" value={formData.bio} onChange={update} textarea required placeholder="Tell students/admins about your experience and strengths."/><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Expected Availability" name="availability" value={formData.availability} onChange={update} placeholder="e.g. Mon–Fri, 4–8 hours/day" required/><Field label="Portfolio Link (optional)" name="portfolio" value={formData.portfolio} onChange={update} placeholder="https://…"/></div><div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">Your {meta.title.toLowerCase()} capability will remain <strong className="text-foreground">pending approval</strong>. You will not be able to accept projects or perform QA until Finalyzed verifies the application.</div></>}
      <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">{saving?'Saving your registration…':'Complete Registration'}{!saving&&<ArrowRight className="w-4 h-4"/>}</button></form></motion.div>}
  </div>;
}

function Field({label,name,value,onChange,type='text',required=false,textarea=false,placeholder=''}:{label:string;name:string;value:string;onChange:(name:string,value:string)=>void;type?:string;required?:boolean;textarea?:boolean;placeholder?:string}) {
 const common={name,value,required,placeholder,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(name,e.target.value),className:'w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'};
 return <label className="space-y-2 block"><span className="text-sm font-medium">{label}{required&&<span className="text-primary"> *</span>}</span>{textarea?<textarea {...common} className={`${common.className} min-h-[120px] resize-y`}/>:<input {...common} type={type}/>}</label>;
}
