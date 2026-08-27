import { supabase } from './supabase';

export type ProjectPlanId = 'basic' | 'standard' | 'premium';
export const PROJECT_PLANS: Record<ProjectPlanId, { id: ProjectPlanId; name: string; maxPages: string; revisions: number; presentation: boolean; presentationGuide: boolean; }> = {
  basic: { id: 'basic', name: 'Basic', maxPages: '62', revisions: 3, presentation: false, presentationGuide: false },
  standard: { id: 'standard', name: 'Standard', maxPages: '75', revisions: 5, presentation: true, presentationGuide: false },
  premium: { id: 'premium', name: 'Premium', maxPages: '100–150', revisions: 10, presentation: true, presentationGuide: true },
};

export interface ProjectSpecification { id?: string; student_id?: string; version?: number; status?: 'DRAFT' | 'CONFIRMED'; planId?: ProjectPlanId; selectedSpecialistId?: string; confirmedAt?: string; updatedAt?: string; createdAt?: string; [key: string]: unknown; }

function toRow(specification: Record<string, unknown>, ownerId: string, status: 'DRAFT' | 'CONFIRMED', version: number) {
  const plan = String(specification.planId ?? specification.plan ?? '') as ProjectPlanId;
  return {
    student_id: ownerId,
    project_title: String(specification.projectTitle ?? 'Untitled project'),
    student_full_name: String(specification.fullName ?? ''),
    matric_number: String(specification.matricNumber ?? ''),
    degree_award: String(specification.degree ?? ''),
    project_type: String(specification.projectType ?? ''),
    plan: plan && plan in PROJECT_PLANS ? plan : null,
    page_requirement: String(specification.pageRequirement ?? specification.maxPages ?? ''),
    citation_style: String(specification.citationStyle ?? ''),
    font: String(specification.font ?? specification.fontFamily ?? ''),
    font_size: String(specification.fontSize ?? specification.bodyFontSize ?? ''),
    line_spacing: String(specification.lineSpacing ?? ''),
    margins: String(specification.margins ?? ('left '+String(specification.marginLeft??'')+', right '+String(specification.marginRight??'')+', top '+String(specification.marginTop??'')+', bottom '+String(specification.marginBottom??''))),
    alignment: String(specification.alignment ?? ''),
    page_numbering: String(specification.pageNumbering ?? specification.preliminaryNumbering ?? ''),
    chapter_headings: String(specification.chapterHeadings ?? specification.chapterHeadingFormat ?? ''),
    chapter_count: Number(specification.chapterCount ?? 5) || 5,
    standards_bodies: String(specification.standardsBodies ?? ''),
    core_subject_matter: String(specification.coreSubjectMatter ?? specification.subjectArea ?? ''),
    target_outcome: String(specification.targetOutcome ?? specification.expectedOutcome ?? ''),
    real_data: String(specification.realData ?? ''),
    scope: String(specification.scope ?? ''),
    special_instructions: String(specification.specialInstructions ?? specification.supervisorInstructions ?? ''),
    confirmed: status === 'CONFIRMED',
    confirmed_at: status === 'CONFIRMED' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveProjectSpecification(ownerId: string, specification: Record<string, unknown>, status: 'DRAFT' | 'CONFIRMED' = 'DRAFT'): Promise<void> {
  const { data: existing, error: readError } = await supabase.from('project_specifications').select('id').eq('student_id', ownerId).maybeSingle();
  if (readError) throw readError;
  const row = toRow(specification, ownerId, status, existing ? 1 : 1);\n  const institutionName = String(specification.institution ?? '').trim();\n  const departmentName = String(specification.department ?? '').trim();\n  if (institutionName) { const { data } = await supabase.from('institutions').select('id').ilike('name', institutionName).limit(1).maybeSingle(); if (data?.id) (row as any).institution_id = data.id; }\n  if (departmentName && (row as any).institution_id) { const { data } = await supabase.from('departments').select('id').eq('institution_id',(row as any).institution_id).ilike('name',departmentName).limit(1).maybeSingle(); if (data?.id) (row as any).department_id = data.id; }
  const { data: saved, error } = existing
    ? await supabase.from('project_specifications').update(row).eq('id', existing.id).select('id').single()
    : await supabase.from('project_specifications').insert(row).select('id').single();
  if (error) throw error;
  if (status === 'CONFIRMED' && saved) {
    const { data: versions, error: versionError } = await supabase.from('project_specification_versions').select('version').eq('specification_id', saved.id).order('version', { ascending: false }).limit(1);
    if (versionError) throw versionError;
    const version = (versions?.[0]?.version ?? 0) + 1;
    const { error: insertError } = await supabase.from('project_specification_versions').insert({ specification_id: saved.id, version, snapshot: specification, created_by: ownerId });
    if (insertError) throw insertError;
  }
}

export async function loadProjectSpecification(ownerId: string): Promise<ProjectSpecification | null> {
  const { data, error } = await supabase.from('project_specifications').select('*').eq('student_id', ownerId).maybeSingle();
  if (error) throw error;
  return data as ProjectSpecification | null;
}

export function validateSpecification(spec: Record<string, unknown>): string[] {
  const required: Array<[string, string]> = [['fullName', 'Full name'], ['matricNumber', 'Matriculation/registration number'], ['institution', 'Institution'], ['department', 'Department'], ['degree', 'Degree/award'], ['projectTitle', 'Approved project title'], ['projectType', 'Project type'], ['citationStyle', 'Citation style'], ['methodology', 'Methodology']];
  return required.filter(([key]) => !String(spec[key] ?? '').trim()).map(([, label]) => `${label} is required.`);
}

export function clearLocalSpecificationCache(): void { localStorage.removeItem('finalyzed_project_draft'); localStorage.removeItem('finalyzed_project_confirmed'); }
