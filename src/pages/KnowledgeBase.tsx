import React, { useEffect, useState } from 'react';
import { Search, Building2, CheckCircle, AlertCircle, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function KnowledgeBase() {
  const { user, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateInstitution, setTemplateInstitution] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDefaults, setTemplateDefaults] = useState('{}');
  const [templateMsg, setTemplateMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: insts }, { data: guides }, { data: tpls }] = await Promise.all([
        supabase.from('institutions').select('*').order('name', { ascending: true }),
        supabase.from('institution_guidelines').select('*').order('observed_at', { ascending: false }),
        supabase.from('institution_templates').select('*').order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      const rows = (insts || []).map((i: any) => ({
        ...i,
        guidelines: (guides || []).filter((g: any) => g.institution_id === i.id),
      }));
      setInstitutions(rows);
      setTemplates(tpls || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredInstitutions = institutions.filter((inst) =>
    (inst.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inst.guidelines || []).some((g: any) =>
      (g.requirement || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const createTemplate = async () => {
    try {
      const parsed = JSON.parse(templateDefaults);
      if (!templateInstitution || !templateName.trim()) throw new Error('Select an institution and name the template.');
      const { error } = await supabase.from('institution_templates').insert({
        institution_id: templateInstitution,
        name: templateName.trim(),
        specification_defaults: parsed,
        verified: true,
      });
      if (error) throw error;
      setTemplateMsg('Template created.');
      setTemplateName('');
      setTemplateDefaults('{}');
      const { data } = await supabase.from('institution_templates').select('*').order('created_at', { ascending: false });
      setTemplates(data || []);
    } catch (e) {
      setTemplateMsg(e instanceof Error ? e.message : 'Invalid template JSON.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <span className="mono-label">Institutional Requirements</span>
        <h1 className="text-3xl md:text-5xl font-light tracking-tight mt-4 mb-6">
          THE <span className="font-bold">KNOWLEDGE BASE</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A searchable legacy of institutional formatting, chapter structures and citation requirements.
        </p>
      </div>

      {userData?.role === 'admin' && (
        <div className="max-w-4xl mx-auto mb-12 bento-card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><h2 className="font-bold text-lg">Knowledge template manager</h2><p className="text-sm text-muted-foreground">Create reusable specification defaults for approved institutional patterns.</p></div>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          {templateMsg && <p className="text-sm text-primary mb-3">{templateMsg}</p>}
          <div className="grid md:grid-cols-2 gap-3">
            <select value={templateInstitution} onChange={e => setTemplateInstitution(e.target.value)} className="form-input">
              <option value="">Select institution</option>
              {institutions.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input value={templateName} onChange={e => setTemplateName(e.target.value)} className="form-input" placeholder="Template name" />
          </div>
          <textarea value={templateDefaults} onChange={e => setTemplateDefaults(e.target.value)} className="form-input mt-3 min-h-[100px] font-mono text-xs" placeholder='{"fontFamily":"Times New Roman","lineSpacing":"2.0"}' />
          <button onClick={() => void createTemplate()} className="btn-primary mt-3 px-5 py-3">Create template</button>
        </div>
      )}

      <div className="max-w-2xl mx-auto relative mb-16">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-muted-foreground" /></div>
        <input type="text" className="form-input pl-12 pr-4 py-4" placeholder="Search for your university or department..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <div className="space-y-6">
        {loading ? <div className="text-center py-12 text-muted-foreground">Loading knowledge base...</div> : filteredInstitutions.map((inst, idx) => (
          <div key={inst.id} className="bento-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" />{inst.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  {(inst.guidelines || []).some((g: any) => g.verified)
                    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle className="w-3 h-3" />Verified Guidelines</span>
                    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><AlertCircle className="w-3 h-3" />Community Observed</span>}
                </div>
              </div>
              {userData?.role === 'student' && (
                <Link to="/start-project" className="btn-secondary whitespace-nowrap text-sm px-4 py-2">Start Project Here</Link>
              )}
            </div>

            {userData?.role === 'student' && templates.some((t: any) => t.institution_id === inst.id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {templates.filter((t: any) => t.institution_id === inst.id).map((t: any) => (
                  <div key={t.id} className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                    <span className="text-xs uppercase tracking-wider font-bold text-primary">Prepaid template</span>
                    <p className="font-semibold mt-1">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Used {t.usage_count || 0} times</p>
                    <Link to={'/start-project?template=' + t.id} className="btn-primary inline-flex mt-3 text-xs px-3 py-2">Use template</Link>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(inst.guidelines || []).map((guide: any) => (
                <div key={guide.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block mb-2">{guide.type || guide.category || 'Requirement'}</span>
                  <p className="text-sm">{guide.requirement}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!loading && filteredInstitutions.length === 0 && (
          <div className="text-center py-12 bento-card p-8">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">Institution Not Found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              We haven't indexed specific requirements for this search yet. Students can continue through the normal specification workflow, where requirements are confirmed before commissioning.
            </p>
            {userData?.role === 'student' && (
              <Link to="/start-project" className="btn-primary inline-flex mt-6 px-5 py-3">Continue to Project Specification</Link>
            )}
          </div>
        )}
      </div>

      <div className="mt-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center max-w-3xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Privacy & Academic Integrity</h3>
        <p className="text-muted-foreground text-sm">
          Finalyzed keeps student-specific information out of the public knowledge base. Only reusable, non-sensitive institutional and departmental requirements belong here.
        </p>
      </div>
    </div>
  );
}
