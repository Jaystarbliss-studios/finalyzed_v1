import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Check, Download, Edit3, FileText, Italic, List, ListOrdered, Save, Underline } from 'lucide-react';

type Props = { projectId: string; projectTitle: string };

const keyFor = (id: string) => `finalyzed:writer-draft:${id}`;

const plainTextFromHtml = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.innerText.replace(/\u00a0/g, ' ');
};

export default function WriterProjectEditor({ projectId, projectTitle }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(keyFor(projectId)) || '';
      setContent(saved);
      if (editorRef.current) editorRef.current.innerHTML = saved;
    } catch { /* storage may be unavailable */ }
  }, [projectId]);

  const plainText = useMemo(() => plainTextFromHtml(content), [content]);
  const wordCount = useMemo(() => plainText.trim() ? plainText.trim().split(/\s+/).length : 0, [plainText]);
  const characterCount = plainText.length;

  const syncContent = () => {
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const saveDraft = () => {
    try {
      const html = editorRef.current?.innerHTML || '';
      localStorage.setItem(keyFor(projectId), html);
      setContent(html);
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch { setSavedAt(null); }
  };

  useEffect(() => {
    if (!content) return;
    const timer = window.setTimeout(saveDraft, 800);
    return () => window.clearTimeout(timer);
  }, [content, projectId]);

  const format = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncContent();
    setMenuOpen(null);
  };

  const exportDraft = () => {
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'finalyzed-project'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const menu = (name: string, label: string, children: React.ReactNode) => (
    <div className="relative">
      <button type="button" onClick={() => setMenuOpen(menuOpen === name ? null : name)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" aria-expanded={menuOpen === name}>
        {label}<span className="text-[10px]">▾</span>
      </button>
      {menuOpen === name && <div className="absolute left-0 top-full z-20 mt-1 min-w-44 rounded-xl border border-border bg-background p-1.5 shadow-xl">{children}</div>}
    </div>
  );

  const menuButton = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">{label}</button>
  );

  return (
    <section className="bento-card overflow-hidden border-primary/20 bg-background">
      <div className="border-b border-border bg-muted/20 p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary"><Edit3 className="w-5 h-5" /><span className="mono-label">WRITER WORKSPACE</span></div>
            <h2 className="text-xl md:text-2xl font-bold mt-2">Write and edit your project</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">An optional document workspace for drafting chapters, sections, references and revisions before you submit the final file for QA.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={saveDraft} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><Save className="w-4 h-4" />Save</button>
            <button type="button" onClick={exportDraft} disabled={!plainText.trim()} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"><Download className="w-4 h-4" />Export</button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1.5 shadow-sm" role="toolbar" aria-label="Document formatting tools">
          {menu('format', 'Format', <>
            {menuButton('Normal text', () => format('formatBlock', 'p'))}
            {menuButton('Heading 1', () => format('formatBlock', 'h1'))}
            {menuButton('Heading 2', () => format('formatBlock', 'h2'))}
            {menuButton('Heading 3', () => format('formatBlock', 'h3'))}
          </>)}
          {menu('insert', 'Insert', <>
            {menuButton('Bullet list', () => format('insertUnorderedList'))}
            {menuButton('Numbered list', () => format('insertOrderedList'))}
            {menuButton('Block quote', () => format('formatBlock', 'blockquote'))}
          </>)}
          {menu('more', 'More', <>
            {menuButton('Clear formatting', () => format('removeFormat'))}
            {menuButton('Align left', () => format('justifyLeft'))}
            {menuButton('Center', () => format('justifyCenter'))}
            {menuButton('Align right', () => format('justifyRight'))}
          </>)}
          <span className="mx-1 h-6 w-px bg-border" />
          <button type="button" onClick={() => format('bold')} className="rounded-lg p-2 hover:bg-muted" aria-label="Bold"><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => format('italic')} className="rounded-lg p-2 hover:bg-muted" aria-label="Italic"><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => format('underline')} className="rounded-lg p-2 hover:bg-muted" aria-label="Underline"><Underline className="w-4 h-4" /></button>
          <button type="button" onClick={() => format('insertUnorderedList')} className="rounded-lg p-2 hover:bg-muted" aria-label="Bullet list"><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => format('insertOrderedList')} className="rounded-lg p-2 hover:bg-muted" aria-label="Numbered list"><ListOrdered className="w-4 h-4" /></button>
          <button type="button" onClick={saveDraft} className="ml-auto rounded-lg p-2 text-primary hover:bg-primary/10" aria-label="Save draft"><Check className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-muted/10 px-3 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-4xl rounded-md border border-border bg-background shadow-sm">
          <div className="border-b border-border px-6 py-4 text-xs text-muted-foreground flex items-center gap-2"><FileText className="w-4 h-4" />Academic document canvas</div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncContent}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                saveDraft();
              }
            }}
            data-placeholder="Start writing your project here…\n\nUse Format for headings, Insert for lists and quotations, and the formatting controls for emphasis."
            aria-label="Project writing editor"
            role="textbox"
            aria-multiline="true"
            spellCheck
            className="min-h-[520px] whitespace-pre-wrap px-7 py-8 text-[15px] leading-8 outline-none md:px-12 md:py-10 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:whitespace-pre-wrap [&:empty]:before:text-muted-foreground"
          />
        </div>
      </div>

      <div className="border-t border-border bg-background px-5 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <span>{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters</span>
        <span>{savedAt ? `Saved ${savedAt}` : 'Draft autosave is enabled'}</span>
      </div>
    </section>
  );
}
