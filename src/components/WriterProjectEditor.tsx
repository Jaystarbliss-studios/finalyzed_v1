import React, { useEffect, useMemo, useState } from 'react';
import { Download, Edit3, Save } from 'lucide-react';

type Props = { projectId: string; projectTitle: string };

const keyFor = (id: string) => `finalyzed:writer-draft:${id}`;

export default function WriterProjectEditor({ projectId, projectTitle }: Props) {
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try { setContent(localStorage.getItem(keyFor(projectId)) || ''); } catch { /* storage may be unavailable */ }
  }, [projectId]);

  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const characterCount = content.length;

  const saveDraft = () => {
    try {
      localStorage.setItem(keyFor(projectId), content);
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch { setSavedAt(null); }
  };

  useEffect(() => {
    if (!content) return;
    const timer = window.setTimeout(saveDraft, 800);
    return () => window.clearTimeout(timer);
  }, [content, projectId]);

  const exportDraft = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'finalyzed-project'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bento-card p-5 md:p-7 border-primary/20">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-primary"><Edit3 className="w-5 h-5" /><span className="mono-label">WRITER WORKSPACE</span></div>
          <h2 className="text-xl font-bold mt-2">Write and edit your project</h2>
          <p className="text-sm text-muted-foreground mt-1">Work directly in Finalyzed. Your draft is saved automatically in this browser and can be exported when ready.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={saveDraft} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Save className="w-4 h-4" />Save</button>
          <button type="button" onClick={exportDraft} disabled={!content.trim()} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"><Download className="w-4 h-4" />Export</button>
        </div>
      </div>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={'Start writing your project here…\n\nYou can draft chapters, sections, references, notes, and revisions before submitting the final document for QA.'} aria-label="Project writing editor" spellCheck className="form-input min-h-[420px] resize-y leading-7 font-sans text-[15px]" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters</span><span>{savedAt ? `Saved ${savedAt}` : 'Draft autosave is enabled'}</span></div>
    </section>
  );
}
