import React,{useMemo,useState} from 'react';
import {CheckCircle2,ChevronDown,Circle,FileText,Hash,Layers3,Ruler,ShieldCheck} from 'lucide-react';

type Specification=Record<string,any>|null;
type Project={id:string;title:string;plan:string;status:string;price_ngn?:number|null;price_points?:number|null};
type Props={project:Project;specification:Specification};

const HIDDEN=new Set(['id','student_id','created_at','updated_at','confirmed_at']);
const LABELS:Record<string,string>={projectTitle:'Project title',project_title:'Project title',institution_id:'Institution',institutionId:'Institution',chapterCount:'Chapter count',chapter_count:'Chapter count',citationStyle:'Citation style',fontFamily:'Font family',bodyFontSize:'Body font size',headingFontSize:'Heading font size',lineSpacing:'Line spacing',projectType:'Project type',pageCount:'Page count',page_count:'Page count',specialInstructions:'Special instructions',special_instructions:'Special instructions',source_template_id:'Template source',source_template_name:'Template name'};
const label=(k:string)=>LABELS[k]??k.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
const text=(v:any)=>{if(v===null||v===undefined||v==='')return 'Not provided';if(typeof v==='boolean')return v?'Yes':'No';if(Array.isArray(v))return v.join(', ');if(typeof v==='object')return JSON.stringify(v,null,2);return String(v)};
const pick=(s:Specification,...keys:string[])=>{for(const k of keys){if(s?.[k]!==undefined&&s[k]!==null&&s[k]!=='')return s[k]}return undefined};
function Field({k,v}:{k:string;v:any}){const obj=v&&typeof v==='object';return <div className="rounded-xl border border-border bg-background p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label(k)}</div>{obj?<pre className="mt-1.5 max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">{text(v)}</pre>:<div className="mt-1.5 break-words whitespace-pre-wrap text-sm font-medium">{text(v)}</div>}</div>}
function Status({value,ok=false}:{value:string;ok?:boolean}){return <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-semibold">{ok?<CheckCircle2 className="h-3.5 w-3.5 text-primary"/>:<Circle className="h-3.5 w-3.5 text-muted-foreground"/>}{value}</span>}
export default function ProjectSpecificationSummary({project,specification}:Props){
 const [open,setOpen]=useState<number|null>(0);
 const answers=pick(specification,'answers')||{};
 const schema=pick(specification,'specification_schema','specificationSchema');
 const stages=useMemo(()=>Array.isArray(schema)&&schema.length?schema.map((s:any,i:number)=>({title:s.title||`Stage ${i+1}`,description:s.description||'',fields:Array.isArray(s.fields)?s.fields:[]})):[
  {title:'Project overview',description:'Core identity and institution requirements.',fields:['projectTitle','projectType','institution_id','institutionId'].filter(k=>answers[k]??specification?.[k]).map(k=>({key:k,label:label(k)}))},
  {title:'Formatting & length',description:'Document formatting, page and structural requirements.',fields:['pageCount','page_count','fontFamily','bodyFontSize','headingFontSize','lineSpacing','chapterCount','chapter_count'].filter(k=>answers[k]??specification?.[k]).map(k=>({key:k,label:label(k)}))},
  {title:'References & methodology',description:'Citation, methodology and supporting requirements.',fields:['citationStyle','methodology','dataRequirements','references'].filter(k=>answers[k]??specification?.[k]).map(k=>({key:k,label:label(k)}))},
  {title:'Instructions & delivery',description:'Special instructions and delivery requirements.',fields:['specialInstructions','special_instructions','project_details','projectDetails'].filter(k=>answers[k]??specification?.[k]).map(k=>({key:k,label:label(k)}))}
 ].filter(s=>s.fields.length||s.title==='Project overview'),[schema,answers,specification]);
 const value=(f:any)=>f._legacyValue!==undefined?f._legacyValue:answers[f.key]??specification?.[f.key];
 const title=pick(specification,'projectTitle','project_title')??project.title;
 const status=String(pick(specification,'status')??(pick(specification,'confirmed')?'CONFIRMED':'DRAFT'));
 const complete=Boolean(pick(specification,'is_complete','isComplete'));
 const confirmed=Boolean(pick(specification,'confirmed'));
 const source=pick(specification,'source_template_name','sourceTemplateName');
 const allKnown=new Set(stages.flatMap(s=>s.fields.map((f:any)=>f.key)));
 const additional=Object.entries({...specification,...answers}).filter(([k,v])=>!HIDDEN.has(k)&&!['answers','specification_schema','specificationSchema'].includes(k)&&!allKnown.has(k)&&v!==null&&v!==undefined&&v!=='');
 return <section className="bento-card mb-6 overflow-hidden">
  <div className="border-b border-border bg-muted/20 p-5 md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
   <div><div className="flex items-center gap-2 text-primary"><FileText className="h-4 w-4"/><span className="mono-label">CONFIRMED SPECIFICATION</span></div><h2 className="mt-2 text-lg font-bold md:text-xl">{title}</h2><p className="mt-1 text-sm text-muted-foreground">The exact requirements attached to this commission, including any template tweaks.</p>{source&&<p className="mt-2 text-xs font-semibold text-primary">Started from template: {source}</p>}</div>
   <div className="flex flex-wrap gap-2"><Status value={status} ok={status==='CONFIRMED'}/><Status value={complete?'Complete':'Incomplete'} ok={complete}/></div>
  </div></div>
  <div className="p-4 md:p-6"><div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</div><div className="mt-1 font-bold">{project.plan}</div></div><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project status</div><div className="mt-1 font-bold">{project.status}</div></div><div className="rounded-xl border border-border p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmation</div><div className="mt-1 font-bold">{confirmed?'Confirmed':'Pending'}</div></div></div>
   <div className="space-y-2">{stages.map((s:any,i:number)=><div key={i} className="overflow-hidden rounded-xl border border-border"><button type="button" onClick={()=>setOpen(open===i?null:i)} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"><div><span className="text-[10px] font-bold uppercase tracking-wider text-primary">Stage {i+1}</span><div className="mt-0.5 font-bold">{s.title}</div></div><ChevronDown className={`h-4 w-4 transition-transform ${open===i?'rotate-180':''}`}/></button>{open===i&&<div className="border-t border-border p-4"><p className="mb-3 text-xs text-muted-foreground">{s.description}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{s.fields.map((f:any)=><div key={f.key}><Field k={f.key} v={value(f)}/></div>)}</div></div>}</div>)}</div>
   {additional.length>0&&<details className="mt-4 rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Additional stored requirements ({additional.length})</summary><div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">{additional.slice(0,50).map(([k,v])=><div key={k}><Field k={k} v={v}/></div>)}</div></details>}
   <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>This view reflects the stored commission specification. Template changes made by the student remain part of the submitted requirements.</div>
  </div>
 </section>
}