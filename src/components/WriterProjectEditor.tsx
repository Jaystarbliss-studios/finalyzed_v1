import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Check, Download, Edit3, FileText, Italic, List, ListOrdered, Save, Underline } from 'lucide-react';

type Props = { projectId: string; projectTitle: string };
const draftKey = (projectId: string) => `finalyzed:writer-draft:${projectId}`;
const getPlainText = (html: string) => { const el = document.createElement('div'); el.innerHTML = html; return el.innerText.replace(/\u00a0/g, ' ').trim(); };

export default function WriterProjectEditor({ projectId, projectTitle }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => { try { const draft = localStorage.getItem(draftKey(projectId)) || ''; setContent(draft); if (editorRef.current) editorRef.current.innerHTML = draft; } catch {} }, [projectId]);
  const plainText = useMemo(() => getPlainText(content), [content]);
  const wordCount = useMemo(() => plainText ? plainText.split(/\s+/).length : 0, [plainText]);
  const syncEditor = () => { if (editorRef.current) setContent(editorRef.current.innerHTML); };
  const saveDraft = () => { const html = editorRef.current?.innerHTML || ''; try { localStorage.setItem(draftKey(projectId), html); setContent(html); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); } catch { setSavedAt(null); } };
  useEffect(() => { if (!content) return; const timer = window.setTimeout(saveDraft, 800); return () => window.clearTimeout(timer); }, [content, projectId]);
  const format = (command: string, value?: string) => { editorRef.current?.focus(); document.execCommand(command, false, value); syncEditor(); };
  const exportDraft = () => { if (!plainText) return; const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${projectTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'finalyzed-project'}.txt`; link.click(); URL.revokeObjectURL(url); };

  return <section className="bento-card overflow-hidden border-primary/20">
    <div className="border-b border-border bg-muted/20 p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><div className="flex items-center gap-2 text-primary"><Edit3 className="h-5 w-5"/><span className="mono-label">WRITER WORKSPACE</span></div><h2 className="mt-2 text-xl font-bold md:text-2xl">Write and edit your project</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Draft chapters, sections, references and revisions before submitting the final document for QA.</p></div>
        <div className="flex shrink-0 gap-2"><button type="button" onClick={saveDraft} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Save className="h-4 w-4"/>Save</button><button type="button" onClick={exportDraft} disabled={!plainText} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"><Download className="h-4 w-4"/>Export</button></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1.5" role="toolbar" aria-label="Document formatting">
        <select defaultValue="p" onChange={e => format('formatBlock', e.target.value)} className="rounded-lg border-0 bg-transparent px-2 py-2 text-xs font-semibold outline-none" aria-label="Text style"><option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select>
        <span className="mx-1 h-6 w-px bg-border"/><button type="button" onClick={() => format('bold')} className="rounded-lg p-2 hover:bg-muted" aria-label="Bold"><Bold className="h-4 w-4"/></button><button type="button" onClick={() => format('italic')} className="rounded-lg p-2 hover:bg-muted" aria-label="Italic"><Italic className="h-4 w-4"/></button><button type="button" onClick={() => format('underline')} className="rounded-lg p-2 hover:bg-muted" aria-label="Underline"><Underline className="h-4 w-4"/></button><button type="button" onClick={() => format('insertUnorderedList')} className="rounded-lg p-2 hover:bg-muted" aria-label="Bullet list"><List className="h-4 w-4"/></button><button type="button" onClick={() => format('insertOrderedList')} className="rounded-lg p-2 hover:bg-muted" aria-label="Numbered list"><ListOrdered className="h-4 w-4"/></button>
        <span className="mx-1 h-6 w-px bg-border"/><button type="button" onClick={() => format('justifyLeft')} className="rounded-lg px-2 py-1.5 text-xs hover:bg-muted">Left</button><button type="button" onClick={() => format('justifyCenter')} className="rounded-lg px-2 py-1.5 text-xs hover:bg-muted">Center</button><button type="button" onClick={() => format('justifyRight')} className="rounded-lg px-2 py-1.5 text-xs hover:bg-muted">Right</button><button type="button" onClick={() => format('removeFormat')} className="ml-auto rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted">Clear</button><button type="button" onClick={saveDraft} className="rounded-lg p-2 text-primary hover:bg-primary/10" aria-label="Save draft"><Check className="h-4 w-4"/></button>
      </div>
    </div>
    <div className="bg-muted/10 px-3 py-6 md:px-8 md:py-10"><div className="mx-auto max-w-4xl rounded-md border border-border bg-background shadow-sm"><div className="flex items-center gap-2 border-b border-border px-6 py-3 text-xs text-muted-foreground"><FileText className="h-4 w-4"/>Project document</div><div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncEditor} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveDraft(); } }} role="textbox" aria-label="Project writing editor" aria-multiline="true" spellCheck data-placeholder="Start writing your project here…" className="min-h-[520px] whitespace-pre-wrap px-7 py-8 text-[15px] leading-8 outline-none md:px-12 md:py-10 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"/></div></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground"><span>{wordCount.toLocaleString()} words · {plainText.length.toLocaleString()} characters</span><span>{savedAt ? `Saved ${savedAt}` : 'Draft autosave enabled'}</span></div>
  </section>;
}
