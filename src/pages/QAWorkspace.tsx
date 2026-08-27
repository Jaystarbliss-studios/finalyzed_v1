import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { doc, getDoc, updateDoc, serverTimestamp } from '../lib/supabaseCompat';

export default function QAWorkspace() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState<'approve' | 'revise' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) return;
        const snapshot = await getDoc(doc(db, 'projects', id));
        if (snapshot.exists()) setProject({ id: snapshot.id, ...snapshot.data() });
      } catch (error) { console.error('Error fetching QA project:', error); }
      finally { setLoading(false); }
    };
    fetchProject();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!verdict || !project || !id || !user || userData?.role !== 'editor') return;
    if (verdict === 'revise' && !feedback.trim()) return;
    setSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', id);
      const patch = verdict === 'approve'
        ? { status: 'AVAILABLE_TO_STUDENT', editorId: user.uid, qaApprovedAt: serverTimestamp(), editorFeedback: feedback.trim() }
        : { status: 'EDITOR_CORRECTION_REQUIRED', editorId: user.uid, qaRejectedAt: serverTimestamp(), editorFeedback: feedback.trim(), revisionsRequired: true };
      await updateDoc(projectRef, patch);
      setProject({ ...project, ...patch, status: patch.status });
    } catch (error) {
      console.error('Unable to submit QA verdict:', error);
      alert('The QA verdict could not be saved. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading QA Workspace…</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;
  if (userData?.role !== 'editor') return <div className="p-8 text-center text-red-500">Only an approved Finalyzed editor can access quality assurance.</div>;

  const spec = project.specification || {};

  return <div className="w-full max-w-6xl mx-auto px-4 py-8">
    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</button>
    <header className="mb-8 border-b border-border pb-6"><span className="mono-label text-primary flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> QA Portal</span><h1 className="text-3xl font-bold mt-2">Quality Assurance: {project.title}</h1><span className="inline-block mt-3 text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-bold uppercase tracking-wider">{String(project.status || '').replace(/_/g, ' ')}</span></header>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {project.status === 'EDITOR_REVIEWING' ? <div className="bento-card p-6 md:p-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><FileText className="w-5 h-5 text-primary" /> Review Submission</h2>
          <div className="bg-muted p-6 rounded-xl mb-8 border border-border"><h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Writer Delivery</h3><div className="flex flex-col gap-3">{project.driveLink && <a href={project.driveLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Open Google Drive Submission</a>}{project.pdfDriveLink && <a href={project.pdfDriveLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Open PDF</a>}{project.docxDriveLink && <a href={project.docxDriveLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Open DOCX</a>}</div>{project.specialistNotes && <div className="mt-4 p-4 bg-background rounded-lg border border-border"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Writer Notes</span><p className="text-sm">{project.specialistNotes}</p></div>}</div>
          <div className="space-y-5"><h3 className="font-bold text-lg">QA Verdict</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={() => setVerdict('approve')} className={`p-4 rounded-xl border-2 text-left ${verdict === 'approve' ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-500/50'}`}><div className="flex justify-between"><span className="font-bold text-green-500">Approve & Deliver</span>{verdict === 'approve' && <CheckCircle className="w-5 h-5 text-green-500" />}</div><p className="text-xs text-muted-foreground mt-2">The submission meets the confirmed specification and Finalyzed QA standard.</p></button><button onClick={() => setVerdict('revise')} className={`p-4 rounded-xl border-2 text-left ${verdict === 'revise' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'}`}><div className="flex justify-between"><span className="font-bold text-red-500">Request Corrections</span>{verdict === 'revise' && <AlertTriangle className="w-5 h-5 text-red-500" />}</div><p className="text-xs text-muted-foreground mt-2">Return the submission to the writer with clear, actionable corrections.</p></button></div>{verdict && <div className="space-y-3"><label className="text-sm font-medium">Editor feedback {verdict === 'revise' && <span className="text-red-500">(required)</span>}</label><textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={verdict === 'revise' ? 'Detail exactly what must be corrected…' : 'Optional notes…'} className="w-full p-4 bg-background border border-border rounded-xl min-h-[130px] resize-y focus:outline-none focus:border-primary" /><button onClick={handleSubmitReview} disabled={submitting || (verdict === 'revise' && !feedback.trim())} className={`w-full py-4 rounded-xl font-bold disabled:opacity-50 ${verdict === 'approve' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{submitting ? 'Saving verdict…' : 'Submit Final Verdict'}</button></div>}</div>
        </div> : <div className="bento-card p-8 text-center"><CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" /><h3 className="text-xl font-bold">This review is not awaiting a verdict</h3><p className="text-muted-foreground mt-2">Current status: {String(project.status || '').replace(/_/g, ' ')}</p></div>}
      </div>
      <aside className="bento-card p-6 h-fit"><h3 className="font-bold mb-4">Confirmed Specification</h3><div className="space-y-4 text-sm"><Spec label="Project Type" value={spec.projectType} /><Spec label="Target Pages" value={spec.targetPages} /><Spec label="Citation Style" value={spec.citationStyle} /><Spec label="Plan" value={project.plan} /><Spec label="Title" value={spec.projectTitle || project.title} /></div></aside>
    </div>
  </div>;
}
function Spec({ label, value }: { label: string; value?: unknown }) { return <div><span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">{label}</span><p className="font-medium px-3 py-2 bg-muted rounded-md break-words">{String(value || 'Not specified')}</p></div>; }
