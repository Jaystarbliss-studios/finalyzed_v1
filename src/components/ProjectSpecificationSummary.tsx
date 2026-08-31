import { useState, type ReactNode } from 'react';
import { CheckCircle2, Circle, ChevronDown, FileText, ShieldCheck } from 'lucide-react';

type Specification = Record<string, unknown> | null;
type Project = { id: string; title: string; plan: string; status: string; price_points?: number | null };
type Props = { project: Project; specification: Specification };
type FieldDef = { key: string; label?: string };
type Stage = { title: string; description: string; fields: FieldDef[] };
type FieldProps = { fieldKey: string; value: unknown };

const HIDDEN = new Set(['id', 'student_id', 'created_at', 'updated_at', 'confirmed_at']);
const LABELS: Record<string, string> = {
  projectTitle: 'Project title', project_title: 'Project title', institution_id: 'Institution ID', institutionId: 'Institution ID',
  margins: 'Margins', chapterCount: 'Chapter count', chapter_count: 'Chapter count', confirmed: 'Confirmed',
  source_template_id: 'Source template ID', sourceTemplateId: 'Source template ID', source_template_name: 'Source template name',
  sourceTemplateName: 'Source template name', title: 'Title', specification_schema: 'Specification schema', specificationSchema: 'Specification schema',
  answers: 'Answers', status: 'Status', is_complete: 'Is complete', isComplete: 'Is complete', project_details: 'Project details', projectDetails: 'Project details',
};

const label = (key: string): string => LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());
const text = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => text(item)).join(', ');
  if (typeof value === 'object') {
    try { return JSON.stringify(value, null, 2) ?? 'Structured value'; } catch { return 'Structured value'; }
  }
  return String(value);
};
const pick = (specification: Specification, ...keys: string[]): unknown => {
  for (const key of keys) { const value = specification?.[key]; if (value !== undefined && value !== null && value !== '') return value; }
  return undefined;
};
function Field({ fieldKey, value }: FieldProps) {
  const objectValue = typeof value === 'object' && value !== null;
  return <div className="rounded-xl border border-border bg-background p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label(fieldKey)}</div>{objectValue ? <pre className="mt-1.5 max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">{text(value)}</pre> : <div className="mt-1.5 break-words whitespace-pre-wrap text-sm font-medium">{text(value)}</div>}</div>;
}
function Status({ value, ok = false }: { value: string; ok?: boolean }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-semibold">{ok ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}{value}</span>;
}
export default function ProjectSpecificationSummary({ project, specification }: Props) {
  const [open, setOpen] = useState<number | null>(0);
  const answers = pick(specification, 'answers');
  const answerMap: Record<string, unknown> = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers as Record<string, unknown> : {};
  const schema = pick(specification, 'specification_schema', 'specificationSchema');
  const schemaStages: Stage[] = Array.isArray(schema) ? schema.filter((stage): stage is Record<string, unknown> => typeof stage === 'object' && stage !== null).map((stage, index) => ({
    title: typeof stage.title === 'string' && stage.title ? stage.title : `Stage ${index + 1}`,
    description: typeof stage.description === 'string' ? stage.description : '',
    fields: Array.isArray(stage.fields) ? stage.fields.filter((field): field is Record<string, unknown> => typeof field === 'object' && field !== null).map((field) => ({ key: String(field.key ?? field.name ?? ''), label: typeof field.label === 'string' ? field.label : undefined })).filter((field) => field.key) : [],
  })) : [];
  const fallbackKeys: Array<[string, string, string[]]> = [
    ['Project overview', 'Core identity and institution requirements.', ['projectTitle', 'project_title', 'projectType', 'institution_id', 'institutionId']],
    ['Formatting & length', 'Document formatting and structural requirements.', ['margins', 'pageCount', 'page_count', 'fontFamily', 'bodyFontSize', 'headingFontSize', 'lineSpacing', 'chapterCount', 'chapter_count']],
    ['References & methodology', 'Citation and methodology requirements.', ['citationStyle', 'methodology', 'dataRequirements', 'references']],
    ['Instructions & delivery', 'Special instructions and delivery requirements.', ['project_details', 'projectDetails', 'specialInstructions', 'special_instructions']],
  ];
  const fallbackStages: Stage[] = fallbackKeys.map(([title, description, keys]) => ({ title, description, fields: keys.filter((key) => answerMap[key] !== undefined || specification?.[key] !== undefined).map((key) => ({ key })) })).filter((stage) => stage.fields.length > 0 || stage.title === 'Project overview');
  const stages = schemaStages.length > 0 ? schemaStages : fallbackStages;
  const valueFor = (field: FieldDef): unknown => answerMap[field.key] ?? specification?.[field.key];
  const title = pick(specification, 'projectTitle', 'project_title') ?? project.title;
  const status = String(pick(specification, 'status') ?? (pick(specification, 'confirmed') === true ? 'CONFIRMED' : 'DRAFT'));
  const complete = pick(specification, 'is_complete', 'isComplete') === true;
  const confirmed = pick(specification, 'confirmed') === true;
  const source = pick(specification, 'source_template_name', 'sourceTemplateName');
  const known = new Set(stages.flatMap((stage) => stage.fields.map((field) => field.key)));
  const additional = Object.entries({ ...(specification ?? {}), ...answerMap }).filter(([key, value]) => !HIDDEN.has(key) && !['answers', 'specification_schema', 'specificationSchema'].includes(key) && !known.has(key) && value !== null && value !== undefined && value !== '');
  const configuredPoints = pick(specification, 'price_points', 'pricePoints', 'points', 'projectPoints');
  const points = typeof configuredPoints === 'number' && Number.isFinite(configuredPoints) && configuredPoints >= 0 ? configuredPoints : typeof project.price_points === 'number' && Number.isFinite(project.price_points) && project.price_points >= 0 ? project.price_points : project.plan.toLowerCase() === 'basic' ? 100 : 150;
  return <section className="bento-card mb-6 overflow-hidden"><div className="border-b border-border bg-muted/20 p-5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex items-center gap-2 text-primary"><FileText className="h-4 w-4" /><span className="mono-label">CONFIRMED SPECIFICATION</span></div><h2 className="mt-2 text-lg font-bold md:text-xl">{title}</h2><p className="mt-1 text-sm text-muted-foreground">The exact requirements attached to this commission.</p>{source && <p className="mt-2 text-xs font-semibold text-primary">Started from template: {text(source)}</p>}</div><div className="flex flex-wrap gap-2"><Status value={status} ok={status.toUpperCase() === 'CONFIRMED'} /><Status value={complete ? 'Complete' : 'Incomplete'} ok={complete} /></div></div></div><div className="p-4 md:p-6"><div className="mb-4 grid gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</div><div className="mt-1 font-bold">{project.plan}</div></div><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project status</div><div className="mt-1 font-bold">{project.status}</div></div><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmation</div><div className="mt-1 font-bold">{confirmed ? 'Confirmed' : 'Pending'}</div></div><div className="rounded-xl border border-primary/20 bg-primary/5 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project price</div><div className="mt-1 font-bold text-primary">{points} Points</div></div></div><div className="space-y-2">{stages.map((stage, index) => <div key={`${stage.title}-${index}`} className="overflow-hidden rounded-xl border border-border"><button type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"><div><span className="text-[10px] font-bold uppercase tracking-wider text-primary">Stage {index + 1}</span><div className="mt-0.5 font-bold">{stage.title}</div></div><ChevronDown className={`h-4 w-4 transition-transform ${open === index ? 'rotate-180' : ''}`} /></button>{open === index && <div className="border-t border-border p-4"><p className="mb-3 text-xs text-muted-foreground">{stage.description}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stage.fields.map((field) => <Field key={field.key} fieldKey={field.key} value={valueFor(field)} />)}</div></div>}</div>)}</div>{additional.length > 0 && <details className="mt-4 rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Additional stored requirements ({additional.length})</summary><div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">{additional.slice(0, 50).map(([key, value]) => <Field key={key} fieldKey={key} value={value} />)}</div></details>}<div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />This view reflects the stored commission specification. Template changes remain part of the submitted requirements.</div></div></section>;
}
