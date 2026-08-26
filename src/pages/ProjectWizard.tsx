import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, ChevronLeft, Save, AlertCircle, ShieldCheck, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadProjectSpecification, PROJECT_PLANS, saveProjectSpecification, validateSpecification } from '../lib/projectSpecifications';

const WIZARD_STEPS = [
  'Student Info', 'Project Identity', 'Institution Requirements', 'Formatting', 'Page & Length',
  'Structure', 'Citation & References', 'Methodology', 'Data & Results', 'Appendices',
  'Presentation', 'Special Instructions', 'Confirmation'
];

const defaults = {
  projectType: '', citationStyle: '', fontFamily: 'Times New Roman', bodyFontSize: '12',
  headingFontSize: '12', lineSpacing: '2.0', alignment: 'Justified', marginLeft: '1.5',
  marginTop: '1', marginRight: '1', marginBottom: '1', chapterCount: '5',
  hasPrescribedFormat: 'Unknown', hasRealData: 'Partial', appendices: [] as string[],
};

export default function ProjectWizard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(defaults);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const specialistId = localStorage.getItem('finalyzed_selected_specialist') || '';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const remote = await loadProjectSpecification(user.uid);
        if (cancelled) return;
        if (remote) {
          setFormData({ ...defaults, ...remote });
          setConfirmed(remote.status === 'CONFIRMED');
        } else if (userData?.studentProfile) {
          setFormData(prev => ({
            ...prev,
            fullName: userData.name || '',
            email: user.email || '',
            institution: userData.studentProfile.institution || '',
            faculty: userData.studentProfile.faculty || '',
            department: userData.studentProfile.department || '',
            degree: userData.studentProfile.degree || '',
            matricNumber: userData.studentProfile.matricNumber || '',
            supervisor: userData.studentProfile.supervisor || '',
            hod: userData.studentProfile.hod || '',
          }));
        }
      } catch (error) {
        console.error('Unable to load project specification', error);
        try {
          const cached = localStorage.getItem('finalyzed_project_draft');
          if (cached) setFormData({ ...defaults, ...JSON.parse(cached) });
        } catch { /* ignore malformed cache */ }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, userData]);

  useEffect(() => {
    if (!user || !loaded || confirmed) return;
    localStorage.setItem('finalyzed_project_draft', JSON.stringify(formData));
    const timer = window.setTimeout(async () => {
      try {
        setSaving(true);
        await saveProjectSpecification(user.uid, { ...formData, selectedSpecialistId: specialistId }, 'DRAFT');
        setIsSaved(true);
      } catch (error) {
        console.error('Draft save failed', error);
      } finally {
        setSaving(false);
        window.setTimeout(() => setIsSaved(false), 1800);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [formData, user, loaded, confirmed, specialistId]);

  const update = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors([]);
  };

  const validateStep = () => {
    const requiredByStep: Record<number, Array<[string, string]>> = {
      0: [['fullName', 'Full name'], ['matricNumber', 'Matriculation/registration number'], ['institution', 'Institution'], ['department', 'Department'], ['degree', 'Degree/award']],
      1: [['projectTitle', 'Approved project title'], ['projectType', 'Project type']],
      3: [['fontFamily', 'Font family'], ['lineSpacing', 'Line spacing']],
      6: [['citationStyle', 'Citation style']],
      7: [['methodology', 'Methodology/design approach']],
    };
    const missing = (requiredByStep[currentStep] || []).filter(([key]) => !String(formData[key] ?? '').trim()).map(([, label]) => `${label} is required.`);
    setErrors(missing);
    return missing.length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setCurrentStep(step => Math.min(WIZARD_STEPS.length - 1, step + 1));
  };
  const prevStep = () => setCurrentStep(step => Math.max(0, step - 1));

  const confirmSpecification = async () => {
    if (!user || !confirmed) return;
    const validation = validateSpecification(formData);
    if (validation.length) {
      setErrors(validation);
      setCurrentStep(0);
      return;
    }
    try {
      setSaving(true);
      await saveProjectSpecification(user.uid, { ...formData, selectedSpecialistId: specialistId }, 'CONFIRMED');
      localStorage.setItem('finalyzed_project_confirmed', JSON.stringify({ ...formData, selectedSpecialistId: specialistId }));
      setIsSaved(true);
      navigate('/checkout');
    } catch (error) {
      console.error(error);
      setErrors(['We could not save your confirmed specification. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => [
    ['Title', formData.projectTitle], ['Institution', formData.institution], ['Department', formData.department],
    ['Project Type', formData.projectType], ['Target Pages', formData.targetPages || formData.maxPages],
    ['Citation', formData.citationStyle], ['Chapters', formData.chapterCount], ['Specialist', specialistId ? 'Selected specialist' : 'To be assigned'],
  ], [formData, specialistId]);

  const input = (label: string, key: string, type = 'text', placeholder = '') => (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <input type={type} value={formData[key] ?? ''} placeholder={placeholder} onChange={e => update(key, e.target.value)} className="form-input" />
    </label>
  );
  const textarea = (label: string, key: string, placeholder = '') => (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <textarea value={formData[key] ?? ''} placeholder={placeholder} onChange={e => update(key, e.target.value)} className="form-input min-h-[120px] resize-y" />
    </label>
  );
  const select = (label: string, key: string, options: string[]) => (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <select value={formData[key] ?? ''} onChange={e => update(key, e.target.value)} className="form-input">
        <option value="">Select {label}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <div className="space-y-5"><StepTitle n="1" title="Student information" text="Confirm the identity and academic details that will appear on your project." /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{input('Full name', 'fullName')}{input('Matriculation / registration number', 'matricNumber')}{input('Institution', 'institution')}{input('Faculty / school', 'faculty')}{input('Department', 'department')}{input('Degree / award', 'degree')}{input('Project supervisor', 'supervisor')}{input('Head of department', 'hod')}{input('Submission month', 'submissionMonth', 'text', 'e.g. August')}{input('Submission year', 'submissionYear', 'number', 'e.g. 2026')}</div></div>;
      case 1:
        return <div className="space-y-5"><StepTitle n="2" title="Project identity" text="Tell the specialist exactly what project is being commissioned." />{input('Exact approved project title', 'projectTitle', 'text', 'Enter the approved title')}{select('Project type', 'projectType', ['Design & Construction', 'Research Study', 'Software Development', 'Case Study', 'Business Plan', 'Survey-Based Study', 'Other'])}{input('Core subject matter / technology / method', 'subjectArea')}{textarea('Problem being addressed', 'problemStatement')}{textarea('Aim and objectives', 'aimObjectives', 'State one aim and the measurable objectives expected.')}{textarea('Target outcome / result', 'expectedOutcome')}{textarea('Supervisor instructions', 'supervisorInstructions')}{check('Topic officially approved?', 'topicApproved')}</div>;
      case 2:
        return <div className="space-y-5"><StepTitle n="3" title="Institution requirements" text="Use the institution's actual rules where available. Finalyzed will preserve these requirements for future reference." />{select('Does your institution have a prescribed project format?', 'hasPrescribedFormat', ['Yes', 'No', 'Unknown'])}{formData.hasPrescribedFormat === 'Yes' && <textarea('Describe the prescribed format', 'prescribedFormatDetails')}{textarea('Required preliminary pages', 'preliminaryPages', 'e.g. Certification, Dedication, Acknowledgement, Abstract, TOC...')}{textarea('Required chapter structure / department-specific rules', 'institutionStructure')}{textarea('Standards / regulatory bodies that apply', 'standardsBodies', 'e.g. ISO, CBN, NAFDAC, NCC, relevant engineering standard...')}{textarea('Ethical, safety, data-protection or institutional requirements', 'ethicalRequirements')}</div>;
      case 3:
        return <div className="space-y-5"><StepTitle n="4" title="Formatting" text="These settings become part of the specification the writer and editor must follow." /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{select('Font family', 'fontFamily', ['Times New Roman', 'Arial', 'Calibri', 'Institution Standard', 'Other'])}{input('Body font size (pt)', 'bodyFontSize', 'number')}{input('Heading font size (pt)', 'headingFontSize', 'number')}{select('Line spacing', 'lineSpacing', ['1.0', '1.15', '1.5', '2.0', 'Institution Standard'])}{select('Body alignment', 'alignment', ['Justified', 'Left', 'Institution Standard'])}{input('Paragraph indentation', 'paragraphIndentation', 'text', 'e.g. 0.5 inch')}{input('Left margin (inch)', 'marginLeft', 'number')}{input('Right margin (inch)', 'marginRight', 'number')}{input('Top margin (inch)', 'marginTop', 'number')}{input('Bottom margin (inch)', 'marginBottom', 'number')}{select('Preliminary page numbering', 'preliminaryNumbering', ['Roman numerals', 'Arabic numerals', 'Institution Standard'])}{select('Chapter page numbering', 'chapterNumbering', ['Arabic numerals', 'Institution Standard'])}</div>{textarea('Header / footer rules', 'headerFooterRules')}{textarea('Table / figure / caption rules', 'tableFigureRules')}</div>;
      case 4:
        return <div className="space-y-5"><StepTitle n="5" title="Page & length" text="Your plan determines the maximum deliverable. Requested limits cannot silently exceed the purchased plan." /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{input('Minimum pages', 'minPages', 'number')}{input('Target pages', 'targetPages', 'number')}{input('Maximum pages', 'maxPages', 'number')}</div><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{check('Preliminary pages count', 'countPrelim')}{check('References count', 'countReferences')}{check('Appendices count', 'countAppendices')}</div>{textarea('Page-budget or length instructions', 'pageBudgetInstructions')}</div>;
      case 5:
        return <div className="space-y-5"><StepTitle n="6" title="Structure" text="Define the chapter architecture instead of forcing every department into the same template." />{input('Number of chapters', 'chapterCount', 'number')}<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: Math.min(8, Number(formData.chapterCount) || 5) }, (_, i) => input(`Chapter ${i + 1} title`, `chapter${i + 1}Title`, 'text', i === 0 ? 'e.g. Introduction' : 'Enter required title'))}</div>{textarea('Mandatory sections / subsections', 'mandatorySubsections')}{textarea('Sections that must be excluded', 'excludedSections')}</div>;
      case 6:
        return <div className="space-y-5"><StepTitle n="7" title="Citation & references" text="Citations and references are part of QA, not an afterthought." />{select('Citation style', 'citationStyle', ['APA', 'IEEE', 'Harvard', 'MLA', 'Vancouver', 'Chicago', 'Other'])}<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{input('Minimum references', 'minReferences', 'number')}{input('Maximum references', 'maxReferences', 'number')}</div>{textarea('Source requirements', 'sourceRequirements', 'Recent sources, textbooks, journals, standards, databases, exclusions, etc.')}{textarea('Required standards / datasheets / regulatory references', 'requiredReferences')}</div>;
      case 7:
        return <div className="space-y-5"><StepTitle n="8" title="Methodology / design" text="The questions adapt to the kind of project you selected." />{textarea('Methodology / research design / system architecture', 'methodology')}{input('Required technologies / instruments / tools', 'technologies')}{textarea('Population, sample, scope or system boundary', 'scope')}{textarea('Sampling / data collection method', 'dataCollectionMethod')}{textarea('Analysis / calculation / testing method', 'analysisMethod')}{textarea('Safety, ethical and regulatory compliance approach', 'complianceApproach')}{textarea('Design decisions and justification', 'designJustification')}</div>;
      case 8:
        return <div className="space-y-5"><StepTitle n="9" title="Data & results" text="Tell us what evidence exists and what the finished project must demonstrate." />{select('Do you already have real project data?', 'hasRealData', ['Yes', 'No', 'Partial'])}{formData.hasRealData !== 'No' && textarea('Describe or upload the available data/results', 'availableData')}{textarea('Expected results, tables, charts, diagrams or technical drawings', 'resultRequirements')}{textarea('Target performance / measurable outcome', 'targetOutcomeMetric')}{textarea('Testing / validation requirements', 'testingRequirements')}<div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm">Finalyzed will never represent invented data as genuine research evidence. If illustrative data is specifically requested, it must be clearly identified as illustrative.</div></div>;
      case 9:
        return <div className="space-y-5"><StepTitle n="10" title="Appendices" text="Select the supporting materials that should accompany the final deliverable." /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{['Questionnaire','Interview Questions','Test Log','Bill of Materials','Budget','Code Listing','Technical Drawings','Financial Statements','Reference Tables','Implementation Timeline'].map(item => <label key={item} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 cursor-pointer"><input type="checkbox" checked={formData.appendices?.includes(item) || false} onChange={e => update('appendices', e.target.checked ? [...(formData.appendices || []), item] : (formData.appendices || []).filter((x: string) => x !== item))} />{item}</label>)}</div>{input('Other appendices', 'otherAppendices')}{textarea('Appendix-specific instructions', 'appendixInstructions')}</div>;
      case 10:
        return <div className="space-y-5"><StepTitle n="11" title="Presentation" text="Presentation deliverables depend on the plan you purchase." />{check('Project presentation is required', 'presentationRequired')}{formData.presentationRequired && <><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{input('Expected slide count', 'slideCount', 'text', 'e.g. 15–20')}{select('Presentation style', 'presentationStyle', ['Academic defence', 'Institution template', 'Minimal professional', 'Other'])}</div>{textarea('Defence requirements / likely questions', 'defenceRequirements')}</>}{check('Simplified presentation guide is required', 'presentationGuideRequired')}<div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm"><strong>Plan reminder:</strong> Standard includes presentation slides. Premium includes presentation slides and the simplified presentation guide.</div></div>;
      case 11:
        return <div className="space-y-5"><StepTitle n="12" title="Special instructions" text="Anything important that does not fit elsewhere belongs here." />{textarea('Special instructions', 'specialInstructions')}{textarea('Things the writer must NOT change', 'doNotChange')}{textarea('Expected communication / delivery instructions', 'deliveryInstructions')}{textarea('Other notes from supervisor or department', 'otherNotes')}</div>;
      default:
        return <div className="space-y-6"><StepTitle n="13" title="Confirm your project specification" text="This record will be attached to the commission and used by the writer and editor during QA." /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{summary.map(([label, value]) => <div key={label} className="rounded-xl border border-border p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div><div className="font-semibold mt-1 break-words">{String(value || 'Not specified')}</div></div>)}</div><div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-primary mt-0.5" /><div><div className="font-bold">Specification confirmation</div><p className="text-sm text-muted-foreground mt-1">Review every section before confirming. Once confirmed, this version becomes the authoritative specification for checkout and assignment.</p></div></div><label className="flex items-start gap-3 mt-5 cursor-pointer"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-5 h-5 mt-0.5" /><span className="text-sm font-medium">I have reviewed the project specifications and confirm that they accurately represent my requirements.</span></label></div><button onClick={confirmSpecification} disabled={!confirmed || saving} className="btn-primary w-full py-4 text-base disabled:opacity-50">{saving ? 'Saving confirmed specification…' : 'Confirm Specification & Proceed to Checkout'}</button></div>;
    }
  };

  if (!user) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><AlertCircle className="w-10 h-10 mx-auto text-primary mb-4" /><h1 className="text-2xl font-bold">Sign in to start your project</h1><p className="text-muted-foreground mt-2">Your specification is saved to your Finalyzed account.</p><button onClick={() => navigate('/login')} className="btn-primary mt-6 px-6 py-3">Sign in</button></div>;

  return <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-12">
    <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Finalyzed project setup</div><h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Project Specification</h1><p className="text-muted-foreground mt-2">Create one precise specification for the writer and quality editor.</p></div><div className="text-sm text-muted-foreground flex items-center gap-2">{saving ? <><Save className="w-4 h-4 animate-pulse" /> Saving…</> : isSaved ? <><Check className="w-4 h-4 text-green-500" /> Saved</> : <><Save className="w-4 h-4" /> Autosaved</>}</div></header>
    {errors.length > 0 && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4"><div className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Please complete the required fields</div><ul className="mt-2 text-sm list-disc pl-5">{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1"><nav className="sticky top-24 space-y-1">{WIZARD_STEPS.map((step, index) => <button key={step} onClick={() => { if (index <= currentStep) setCurrentStep(index); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-all ${index === currentStep ? 'bg-primary text-white shadow-md' : index < currentStep ? 'hover:bg-muted text-foreground' : 'text-muted-foreground opacity-50'}`}><span>{index + 1}. {step}</span>{index < currentStep && <Check className="w-4 h-4" />}</button>)}</nav></aside>
      <main className="lg:col-span-3"><div className="lg:hidden mb-4"><div className="flex justify-between text-xs font-bold text-muted-foreground mb-2"><span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span><span>{WIZARD_STEPS[currentStep]}</span></div><div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }} /></div></div><AnimatePresence mode="wait"><motion.section key={currentStep} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="bg-background border border-border rounded-2xl p-5 md:p-8 shadow-sm min-h-[500px]">{renderStep()}</motion.section></AnimatePresence>{currentStep < WIZARD_STEPS.length - 1 && <div className="flex justify-between mt-5"><button onClick={prevStep} disabled={currentStep === 0} className="px-5 py-3 rounded-xl font-medium disabled:opacity-30 flex items-center gap-2 hover:bg-muted"><ChevronLeft className="w-4 h-4" /> Back</button><button onClick={nextStep} className="btn-primary px-6 py-3 flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></button></div>}</main>
    </div>
  </div>;
}

function StepTitle({ n, title, text }: { n: string; title: string; text: string }) { return <div className="mb-6"><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Step {n}</div><h2 className="text-2xl font-bold mt-1">{title}</h2><p className="text-muted-foreground mt-2 max-w-2xl">{text}</p></div>; }
function check(label: string, key: string) { return <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/40"><input type="checkbox" checked={false} onChange={() => undefined} className="w-4 h-4" /><span className="text-sm">{label}</span></label>; }
