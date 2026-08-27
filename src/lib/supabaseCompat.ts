import { supabase } from './supabase';

type QuerySpec = { table: string; filters: Array<{ column: string; value: unknown }>; order?: { column: string; ascending?: boolean }; limit?: number };

const tableFor = (path: string) => path.split('/')[0];
export const collection = (_db: typeof supabase, path: string) => ({ __query: { table: tableFor(path), filters: [] } as QuerySpec });
export const where = (column: string, _op: string, value: unknown) => ({ __where: { column, value } });
export const orderBy = (column: string, direction: 'asc' | 'desc' = 'asc') => ({ __order: { column, ascending: direction === 'asc' } });
export const limit = (value: number) => ({ __limit: value });

export const query = (ref: any, ...clauses: any[]) => {
  const q: QuerySpec = { ...ref.__query, filters: [...(ref.__query?.filters || [])] };
  for (const clause of clauses) {
    if (clause?.__where) q.filters.push(clause.__where);
    if (clause?.__order) q.order = clause.__order;
    if (clause?.__limit) q.limit = clause.__limit;
  }
  return { __query: q };
};

const execute = async (spec: QuerySpec) => {
  let request: any = supabase.from(spec.table).select('*');
  for (const f of spec.filters) request = request.eq(f.column, f.value);
  if (spec.order) request = request.order(spec.order.column, { ascending: spec.order.ascending ?? true });
  if (spec.limit) request = request.limit(spec.limit);
  const { data, error } = await request;
  return { data: data || [], error };
};

export const getDocs = async (ref: any) => {
  const result = await execute(ref.__query);
  const docs = (result.data || []).map((row: any) => ({ id: row.id, data: () => row }));
  return { docs, empty: docs.length === 0, ...result };
};

export const getDoc = async (ref: any) => {
  const { data, error } = await supabase.from(ref.__doc.table).select('*').eq('id', ref.__doc.id).maybeSingle();
  return { exists: () => Boolean(data), id: data?.id || ref.__doc.id, data: () => data, error };
};

export const doc = (_db: typeof supabase, path: string, id: string) => ({ __doc: { table: tableFor(path), id } });
export const addDoc = async (ref: any, data: Record<string, unknown>) => {
  const { data: row, error } = await supabase.from(ref.__query.table).insert(data).select('id').single();
  if (error) throw error;
  return { id: row.id };
};
export const updateDoc = async (ref: any, data: Record<string, unknown>) => {
  const { error } = await supabase.from(ref.__doc.table).update(data).eq('id', ref.__doc.id);
  if (error) throw error;
};
export const setDoc = async (ref: any, data: Record<string, unknown>, options?: { merge?: boolean }) => {
  const { error } = options?.merge
    ? await supabase.from(ref.__doc.table).upsert({ id: ref.__doc.id, ...data })
    : await supabase.from(ref.__doc.table).upsert({ id: ref.__doc.id, ...data });
  if (error) throw error;
};
export const serverTimestamp = () => new Date().toISOString();
export const onSnapshot = (_ref: any, callback: (snapshot: any) => void) => {
  let active = true;
  void getDocs(_ref).then(snapshot => { if (active) callback(snapshot); });
  return () => { active = false; };
};
