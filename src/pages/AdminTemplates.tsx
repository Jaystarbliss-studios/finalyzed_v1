import React from 'react';
import {Feather, ShieldCheck} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {Navigate} from 'react-router-dom';
import ProjectTemplateManager from '../components/ProjectTemplateManager';

export default function AdminTemplates(){
 const {userData}=useAuth();
 if(userData?.role!=='admin') return <Navigate to="/dashboard" replace />;
 return <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
  <header className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Feather className="w-6 h-6"/></div><div><span className="mono-label text-primary">Admin · Knowledge Base</span><h1 className="text-3xl font-light mt-1">Project <b>Templates</b></h1><p className="text-sm text-muted-foreground mt-2 max-w-3xl">Create the exact 13-stage specification students use. When published, the completed answers become a reusable institutional template in the Knowledge Base.</p></div></header>
  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex gap-3 text-sm"><ShieldCheck className="w-5 h-5 text-primary shrink-0"/><p>Templates are blueprints. A student's “Use” action copies the answers into a separate editable project specification, so their tweaks never overwrite the original template.</p></div>
  <ProjectTemplateManager/>
 </div>;
}
