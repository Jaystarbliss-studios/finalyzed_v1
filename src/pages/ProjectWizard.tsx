import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FINALYZED_DEFAULT_TEMPLATE, TemplateStep } from '../components/ProjectTemplateManager';
import InstitutionPicker from '../components/InstitutionPicker';
import { loadProjectSpecification, saveProjectSpecification } from '../lib/projectSpecifications';
import { supabase } from '../lib/supabase';

const DEFAULTS: Record<string, any> = {
  projectType: '', citationStyle: '', fontFamily: 'Times New Roman', bodyFontSize: '12', headingFontSize: '12',
  lineSpacing: '2.0', alignment: 'Justified', marginLeft: '1.5', marginRight: '1', marginTop: '1', marginBottom: '1',
  chapterCount: '5', appendices: [],
};

function schemaWithInstitution(schema: TemplateStep[]): TemplateStep[] {
  const hasInstitution = schema.some((step) => step.fields.some((field) => field.key === 'institution'));
  if (hasInstitution) return schema;
  const first = schema[0] || { title: 'Student Information', description: 'Academic identity and submission context.', fields: [] };
  return [{ ...first, fields: [{ key: 'institution', label: 'Institution', type: 'text', required: true }, ...first.fields] }, ...schema.slice(1)];
}

function isAnswered(field: any, value: any): boolean {
  if (field.required !== true) return true;
  if (field.type === 'checkbox') return typeof value === 'boolean';
  if (field.type === 'multiselect') return Array.isArray(value) && value.length > 0;
  return String(value ?? '').trim().length > 0;
}

function Field({ field, value, update }: { field: any; value: any; update: (key: string, value: any) => void }) {
  const required = field.required === true;
  const label = <span className="text-sm font-semibold">{field.label}{required && <span className="text-primary"> *</span>}</span>;

  if (field.key === 'institution') {
    return <div className="md:col-span-2"><InstitutionPicker value={String(value || '')} onChange={(next) => update('institution', next)} required={required} /></div>;
  }
  if (field.type === 'checkbox') {
    const selected = typeof value === 'boolean' ? value : undefined;
    return <fieldset className="md:col-span-2 space-y-2"><legend>{label}</legend><div className="grid grid-cols-2 gap-2">
      {[['Yes', true], ['No', false]].map(([text, choice]) => <label key={String(text)} className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${selected === choice ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <input type="radio" name={field.key} checked={selected === choice} onChange={() => update(field.key, choice)} className="h-4 w-4" /><span className="text-sm font-semibold">{text}</span>
      </label>)}
    </div></fieldset>;
  }
  if (field.type === 'textarea') return <label className="md:col-span-2 block space-y-2">{label}<textarea value={value ?? ''} placeholder={field.placeholder || ''} onChange={(e) => update(field.key, e.target.value)} className="form-input min-h-[130px] resize-y" /></label>;
  if (field.type === 'multiselect') return <fieldset className="md:col-span-2 space-y-2"><legend>{label}</legend><div className="grid sm:grid-cols-2 gap-2">
    {(field.options || []).map((option: string) => { const selected = Array.isArray(value) && value.includes(option); return <label key={option} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer"><input type="checkbox" checked={selected} onChange={(e) => update(field.key, e.target.checked ? [...(Array.isArray(value) ? value : []), option] : (Array.isArray(value) ? value : []).filter((item: string) => item !== option))} className="h-4 w-4" /><span className="text-sm">{option}</span></label>; })}
  </div></fieldset>;
  if (field.type === 'select') return <label className="block space-y-2">{label}<select value={value ?? ''} onChange={(e) => update(field.key, e.target.value)} className="form-input"><option value="">Select {field.label}</option>{(field.options || []).map((option: string) => <option key={option} value={option}>{option}</option>)}</select></label>;
  return <label className="block space-y-2">{label}<input type={field.type === 'number' ? 'number' : 'text'} value={value ?? ''} placeholder={field.placeholder || ''} onChange={(e) => update(field.key, e.target.value)} className="form-input" /></label>;
}

export default function ProjectWizard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const templateId = params.get('template') || '';
  const [schema, setSchema] = useState<TemplateStep[]>(FINALYZED_DEFAULT_TEMPLATE);
  const [data, setData] = useState<Record<string, any>>({ ...DEFAULTS });
  const [sourceTemplateName, setSourceTemplateName] = useState('');
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) return;
      try {
        if (templateId) {
          const { data: template, error } = await supabase.from('institution_templates').select('id,name,institution_id,specification_schema,specification_defaults').eq('id', templateId).maybeSingle();
          if (error) throw error;
          if (!template) throw new Error('Template not found.');
          if (cancelled) return;
          setSchema(schemaWithInstitution((template.specification_schema || FINALYZED_DEFAULT_TEMPLATE) as TemplateStep[]));
          setSourceTemplateName(template.name || '');
          setSourceTemplateId(template.id || null);
          setData({ ...DEFAULTS, ...(template.specification_defaults || {}), institution: template.specification_defaults?.institution || '' });
          setStep(0);
        } else {
          const remote = await loadProjectSpecification(user.id);
          if (cancelled) return;
          if (remote) setData({ ...DEFAULTS, ...remote });
          else if (userData?.studentProfile) {
            setData((current) => ({ ...current, fullName: userData.name || '', email: user.email || '', institution: userData.studentProfile.institution || '', faculty: userData.studentProfile.faculty || '', department: userData.studentProfile.department || '', degree: userData.studentProfile.degree || '', matricNumber: userData.studentProfile.matricNumber || '', supervisor: userData.studentProfile.supervisor || '', hod: userData.studentProfile.hod || '' }));
          }
        }
      } catch (error) {
        console.error('Project wizard load failed:', error);
        setErrors([error instanceof Error ? error.message : 'Unable to load the project form.']);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, userData, templateId]);

  useEffect(() => {
    if (!user || !loaded || confirmed || templateId) return;
    const timer = window.setTimeout(async () => {
      try { setSaving(true); await saveProjectSpecification(user.id, { ...data, selectedSpecialistId: localStorage.getItem('finalyzed_selected_specialist') || '' }, 'DRAFT'); setSaved(true); }
      catch (error) { console.error('Draft save failed:', error); }
      finally { setSaving(false); }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [data, user, loaded, confirmed, templateId]);

  const activeSchema = useMemo(() => schemaWithInstitution(schema), [schema]);
  const totalSteps = activeSchema.length + 1;
  const current = activeSchema[step];
  const update = (key: string, value: any) => { setData((currentData) => ({ ...currentData, [key]: value })); setErrors([]); setSaved(false); };

  const validateCurrent = () => {
    if (!current) return true;
    const missing = current.fields.filter((field: any) => !isAnswered(field, data[field.key])).map((field: any) => `${field.label} is required.`);
    setErrors(missing);
    return missing.length === 0;
  };

  const goNext = () => { if (validateCurrent()) setStep((currentStep) => Math.min(totalSteps - 1, currentStep + 1)); };
  const goBack = () => setStep((currentStep) => Math.max(0, currentStep - 1));

  const confirm = async () => {
    const missing = activeSchema.flatMap((section) => section.fields.filter((field: any) => !isAnswered(field, data[field.key])).map((field: any) => `${section.title}: ${field.label} is required.`));
    if (missing.length) { setErrors(missing); setStep(0); return; }
    if (!confirmed) { setErrors(['Please confirm that you reviewed the specification before continuing.']); return; }
    if (!user) return;

    try {
      setSaving(true);
      let institutionId: string | null = null;
      if (data.institution) {
        const { data: institution, error } = await supabase.from('institutions').select('id').ilike('name', String(data.institution).trim()).limit(1).maybeSingle();
        if (error) throw error;
        institutionId = institution?.id || null;
      }
      const specialistId = localStorage.getItem('finalyzed_selected_specialist') || '';
      const { data: specification, error: specificationError } = await supabase.from('project_specifications').insert({
        student_id: user.id,
        institution_id: institutionId,
        source_template_id: sourceTemplateId,
        source_template_name: sourceTemplateName || null,
        project_title: data.projectTitle || 'Project Specification',
        title: data.projectTitle || 'Project Specification',
        specification_schema: activeSchema,
        answers: { ...data, institutionId, selectedSpecialistId: specialistId },
        status: 'confirmed',
        is_complete: true,
        confirmed: true,
        submitted_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      }).select('id').single();
      if (specificationError) throw specificationError;

      try { await supabase.rpc('create_template_from_completed_specification', { p_specification_id: specification.id }); }
      catch (error) { console.warn('Student template promotion skipped:', error); }

      await supabase.from('project_specification_versions').insert({
        specification_id: specification.id,
        version: 1,
        snapshot: { ...data, institutionId, selectedSpecialistId: specialistId, sourceTemplateId },
        created_by: user.id,
      });

      localStorage.setItem('finalyzed_project_confirmed', JSON.stringify({ ...data, institutionId, selectedSpecialistId: specialistId, specificationId: specification.id }));
      navigate('/checkout');
    } catch (error) {
      console.error('Project confirmation failed:', error);
      setErrors(['We could not save your confirmed specification. Please try again.']);
    } finally { setSaving(false); }
  };

  if (!user) return <Navigate to="/login" replace state={{ from: '/start-project' }} />;
  if (userData && userData.role !== 'student') return <Navigate to="/dashboard" replace />;
  if (!loaded) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading project form…</div>;

  const isConfirmation = step === activeSchema.length;

  return <main className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
    <div className="mb-7 flex items-start justify-between gap-4">
      <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Project specification</div><h1 className="text-2xl md:text-3xl font-bold mt-1">Tell us exactly what your project needs</h1><p className="text-sm text-muted-foreground mt-2 max-w-3xl">Choose any university or polytechnic at any point. If you started from a template, every field remains editable for your own project.</p></div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground"><Save className="h-4 w-4" />{saving ? 'Saving…' : saved ? 'Draft saved' : 'Auto-save'}</div>
    </div>

    {sourceTemplateName && <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex gap-3"><ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div><p className="font-semibold">Template applied: {sourceTemplateName}</p><p className="text-sm text-muted-foreground mt-1">The template provides a starting point only. You can change the institution, project title, formatting, requirements, and every other answer before submitting.</p></div></div>}

    <div className="mb-6 overflow-x-auto pb-1"><div className="flex gap-2 min-w-max">{[...activeSchema.map((section) => section.title), 'Confirmation'].map((title, index) => <button key={`${title}-${index}`} type="button" onClick={() => index <= step && setStep(index)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${index === step ? 'border-primary bg-primary text-primary-foreground' : index < step ? 'border-primary/30 text-primary' : 'border-border text-muted-foreground'}`}>{index + 1}. {title}</button>)}</div></div>

    <section className="rounded-2xl border border-border bg-background p-5 md:p-8 shadow-sm">
      {!isConfirmation ? <>
        <div className="mb-6"><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Step {step + 1} of {activeSchema.length}</div><h2 className="text-xl md:text-2xl font-bold mt-1">{current.title}</h2><p className="text-sm text-muted-foreground mt-2">{current.description}</p></div>
        {errors.length > 0 && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600"><b>Please check:</b><ul className="list-disc ml-5 mt-1">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{current.fields.map((field: any) => <Field key={field.key} field={field} value={data[field.key]} update={update} />)}</div>
      </> : <>
        <div className="mb-6"><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Final step</div><h2 className="text-xl md:text-2xl font-bold mt-1">Review and confirm</h2><p className="text-sm text-muted-foreground mt-2">Check your answers before the specification is sent to checkout.</p></div>
        {errors.length > 0 && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        <div className="grid sm:grid-cols-2 gap-3">{[['Project title', data.projectTitle], ['Institution', data.institution], ['Department', data.department], ['Degree / award', data.degree], ['Project type', data.projectType], ['Citation style', data.citationStyle], ['Target pages', data.targetPages], ['Chapters', data.chapterCount]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold mt-1 break-words">{String(value || 'Not specified')}</div></div>)}</div>
        <label className="mt-6 flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer"><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setErrors([]); }} className="mt-1 h-4 w-4" /><span className="text-sm">I have reviewed my project specification and confirm that the information provided is correct.</span></label>
      </>}

      <div className="mt-8 pt-5 border-t border-border flex items-center justify-between gap-3"><button type="button" onClick={goBack} disabled={step === 0 || saving} className="btn-secondary px-4 py-2 disabled:opacity-40"><ChevronLeft className="inline h-4 w-4 mr-1" />Back</button>{isConfirmation ? <button type="button" onClick={() => void confirm()} disabled={saving || !confirmed} className="btn-primary px-5 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Confirm & continue'}<Check className="inline h-4 w-4 ml-2" /></button> : <button type="button" onClick={goNext} className="btn-primary px-5 py-2">Next<ChevronRight className="inline h-4 w-4 ml-2" /></button>}</div>
    </section>
  </main>;
}
