import fs from 'fs';

const newCode = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Send, Clock, CheckCircle, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!verdict || !project || !id) return;
    setSubmitting(true);
    
    try {
      const projectRef = doc(db, 'projects', id);
      
      if (verdict === 'approve') {
        // Pass to student
        await updateDoc(projectRef, {
          status: 'AVAILABLE_TO_STUDENT',
          editorId: user?.uid,
          qaApprovedAt: serverTimestamp(),
          editorFeedback: feedback
        });
        setProject({ ...project, status: 'AVAILABLE_TO_STUDENT' });
      } else {
        // Kick back to specialist
        await updateDoc(projectRef, {
          status: 'PAYMENT_CONFIRMED', // or a specific revision status, assuming this goes back to work queue
          editorId: user?.uid,
          qaRejectedAt: serverTimestamp(),
          specialistNotes: feedback, // overwrite or append for specialist to see
          revisionsRequired: true
        });
        setProject({ ...project, status: 'PAYMENT_CONFIRMED' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading QA Workspace...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  const spec = project.specification || {};

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <header className="mb-8 border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <span className="mono-label text-yellow-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> QA Portal
            </span>
            <h1 className="text-3xl font-bold mt-2">Quality Assurance: {project.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md font-bold uppercase tracking-wider">
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {project.status === 'EDITOR_REVIEWING' ? (
            <div className="bento-card p-6 md:p-8">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                Review Submission
              </h2>
              
              <div className="bg-muted p-6 rounded-xl mb-8 border border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Specialist Delivery</h3>
                <a href={project.driveLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium text-lg flex items-center gap-2">
                  Open Google Document (Read/Comment Access)
                </a>
                {project.specialistNotes && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Notes from Specialist</span>
                    <p className="text-sm">{project.specialistNotes}</p>
                  </div>
                )}
                {project.revisionNotes && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500 block mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Student Revision Request</span>
                    <p className="text-sm text-red-400">{project.revisionNotes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-lg">QA Verdict</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setVerdict('approve')}
                    className={\`p-4 rounded-xl border-2 text-left transition-all \${
                      verdict === 'approve' 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-border hover:border-green-500/50'
                    }\`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-green-500">Approve & Deliver</span>
                      {verdict === 'approve' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">The work meets all Finalyzed standards and client specifications. Pass to student.</p>
                  </button>

                  <button 
                    onClick={() => setVerdict('revise')}
                    className={\`p-4 rounded-xl border-2 text-left transition-all \${
                      verdict === 'revise' 
                        ? 'border-red-500 bg-red-500/10' 
                        : 'border-border hover:border-red-500/50'
                    }\`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-red-500">Request Revisions</span>
                      {verdict === 'revise' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">The work requires corrections. Send back to the specialist.</p>
                  </button>
                </div>

                {verdict && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Feedback / Context</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={verdict === 'approve' ? "Optional notes for the student..." : "REQUIRED: Detail exactly what the specialist needs to fix..."}
                        className="w-full p-4 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-y"
                      />
                    </div>
                    
                    <button
                      onClick={handleSubmitReview}
                      disabled={submitting || (verdict === 'revise' && !feedback.trim())}
                      className={\`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 \${
                        verdict === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                      }\`}
                    >
                      {submitting ? 'Processing...' : 'Submit Final Verdict'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bento-card p-8 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Review Complete</h3>
              <p className="text-muted-foreground max-w-md">
                You have successfully processed this project. It is currently in the "{project.status}" state.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bento-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Original Specification
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Project Type</span>
                <p className="font-medium text-sm px-3 py-2 bg-muted rounded-md">{spec.projectType || 'Standard Academic'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Target Pages / Length</span>
                <p className="font-medium text-sm px-3 py-2 bg-muted rounded-md">{spec.targetPages || spec.length || 'Not Specified'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Citation Style</span>
                <p className="font-medium text-sm px-3 py-2 bg-muted rounded-md">{spec.citationStyle || 'Standard'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Plan Level</span>
                <p className="font-medium text-sm px-3 py-2 bg-muted rounded-md capitalize text-primary">{project.plan || 'Standard'}</p>
              </div>
            </div>
          </div>
          
          <div className="bento-card p-6 border-red-500/20">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              QA Violations
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              If this specialist repeatedly violates QA standards, you can flag their account for admin review.
            </p>
            <button className="w-full py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-sm font-medium hover:bg-red-500/20 transition-colors">
              Flag Specialist Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/QAWorkspace.tsx', newCode);
console.log('patched qa workspace');
