import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Institution = {
  id: string;
  name: string;
  ownership?: string;
  state?: string | null;
  verified?: boolean;
  institution_type?: 'university' | 'polytechnic' | 'other';
};

type InstitutionPickerProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export default function InstitutionPicker({ value, onChange, required = false }: InstitutionPickerProps) {
  const [items, setItems] = useState<Institution[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'university' | 'polytechnic'>('all');
  const [other, setOther] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'university' | 'polytechnic'>('university');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('institutions').select('id,name,ownership,state,verified,institution_type').order('name');
      if (!error) setItems((data || []) as Institution[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((institution) => {
      const institutionType = institution.institution_type || 'university';
      return (type === 'all' || institutionType === type) && (!needle || institution.name.toLowerCase().includes(needle));
    });
  }, [items, query, type]);

  const grouped = (group: 'university' | 'polytechnic') => filtered.filter((institution) => (institution.institution_type || 'university') === group);

  const selectInstitution = (name: string) => {
    setMessage('');
    onChange(name);
  };

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setMessage('');
    const { data, error } = await supabase.rpc('add_institution', {
      p_name: newName.trim(), p_state: null, p_ownership: 'other', p_institution_type: newType,
    });
    if (error) {
      setMessage(error.message);
    } else {
      const row: Institution = {
        id: data?.id, name: data?.name || newName.trim(), ownership: 'other', verified: false,
        institution_type: data?.institution_type || newType,
      };
      setItems((current) => [...current.filter((item) => item.id !== row.id), row].sort((a, b) => a.name.localeCompare(b.name)));
      selectInstitution(row.name);
      setOther(false);
      setNewName('');
      setMessage(data?.existing ? 'Institution selected.' : 'Institution added. It will be reviewed by Finalyzed.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">Institution{required && <span className="text-primary"> *</span>}</span>
      {!other ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', 'university', 'polytechnic'] as const).map((option) => (
              <button key={option} type="button" onClick={() => setType(option)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${type === option ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                {option === 'all' ? 'All institutions' : option === 'university' ? 'Universities' : 'Polytechnics'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="form-input pl-9 pr-10"
              placeholder="Search universities or polytechnics…" aria-label="Search universities or polytechnics" />
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
          <select value={value} required={required}
            onChange={(event) => event.target.value === '__OTHER__' ? setOther(true) : selectInstitution(event.target.value)}
            className="form-input" aria-label="Select institution">
            <option value="">Select institution</option>
            {type !== 'polytechnic' && grouped('university').length > 0 && (
              <optgroup label="Universities">{grouped('university').map((institution) => <option key={institution.id} value={institution.name}>{institution.name}{institution.ownership && institution.ownership !== 'other' ? ` · ${institution.ownership}` : ''}</option>)}</optgroup>
            )}
            {type !== 'university' && grouped('polytechnic').length > 0 && (
              <optgroup label="Polytechnics">{grouped('polytechnic').map((institution) => <option key={institution.id} value={institution.name}>{institution.name}{institution.ownership && institution.ownership !== 'other' ? ` · ${institution.ownership}` : ''}</option>)}</optgroup>
            )}
            <option value="__OTHER__">Other — add institution</option>
          </select>
          {query && filtered.length === 0 && <p className="text-xs text-muted-foreground">No institution matched “{query}”. Try another search or add it below.</p>}
        </>
      ) : (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
            <input value={newName} onChange={(event) => setNewName(event.target.value)} className="form-input" placeholder="Enter your institution's full name" />
            <select value={newType} onChange={(event) => setNewType(event.target.value as 'university' | 'polytechnic')} className="form-input"><option value="university">University</option><option value="polytechnic">Polytechnic</option></select>
            <button type="button" onClick={() => void add()} disabled={saving || !newName.trim()} className="btn-primary px-4" aria-label="Add institution"><Check className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={() => setOther(false)} className="text-xs text-muted-foreground hover:text-foreground">Back to institution catalogue</button>
        </div>
      )}
      {message && <p className="flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" />{message}</p>}
    </div>
  );
}
