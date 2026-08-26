import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type ProjectPlanId = 'basic' | 'standard' | 'premium';

export const PROJECT_PLANS: Record<ProjectPlanId, {
  id: ProjectPlanId;
  name: string;
  maxPages: string;
  revisions: number;
  presentation: boolean;
  presentationGuide: boolean;
}> = {
  basic: { id: 'basic', name: 'Basic', maxPages: '62', revisions: 3, presentation: false, presentationGuide: false },
  standard: { id: 'standard', name: 'Standard', maxPages: '75', revisions: 5, presentation: true, presentationGuide: false },
  premium: { id: 'premium', name: 'Premium', maxPages: '100–150', revisions: 10, presentation: true, presentationGuide: true },
};

export interface ProjectSpecification {
  ownerId: string;
  version: number;
  status: 'DRAFT' | 'CONFIRMED';
  planId?: ProjectPlanId;
  selectedSpecialistId?: string;
  confirmedAt?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
  [key: string]: unknown;
}

export async function saveProjectSpecification(
  ownerId: string,
  specification: Record<string, unknown>,
  status: 'DRAFT' | 'CONFIRMED' = 'DRAFT',
): Promise<void> {
  const ref = doc(db, 'projectSpecifications', ownerId);
  const existing = await getDoc(ref);
  const previous = existing.exists() ? (existing.data().version || 0) : 0;
  const currentVersion = status === 'CONFIRMED' ? previous + 1 : Math.max(1, previous);

  await setDoc(ref, {
    ...specification,
    ownerId,
    version: currentVersion,
    status,
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    ...(status === 'CONFIRMED' ? { confirmedAt: serverTimestamp() } : {}),
  }, { merge: true });
}

export async function loadProjectSpecification(ownerId: string): Promise<ProjectSpecification | null> {
  const snapshot = await getDoc(doc(db, 'projectSpecifications', ownerId));
  return snapshot.exists() ? snapshot.data() as ProjectSpecification : null;
}

export function validateSpecification(spec: Record<string, unknown>): string[] {
  const required: Array<[string, string]> = [
    ['fullName', 'Full name'],
    ['matricNumber', 'Matriculation/registration number'],
    ['institution', 'Institution'],
    ['department', 'Department'],
    ['degree', 'Degree/award'],
    ['projectTitle', 'Approved project title'],
    ['projectType', 'Project type'],
    ['citationStyle', 'Citation style'],
    ['methodology', 'Methodology'],
  ];
  return required.filter(([key]) => !String(spec[key] ?? '').trim()).map(([, label]) => `${label} is required.`);
}

export function clearLocalSpecificationCache(): void {
  localStorage.removeItem('finalyzed_project_draft');
  localStorage.removeItem('finalyzed_project_confirmed');
}
