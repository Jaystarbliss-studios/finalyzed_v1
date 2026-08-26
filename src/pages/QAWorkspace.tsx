import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function QAWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [checklist, setChecklist] = useState({
    formatting: false,
    citations: false,
    tone: false,
    plagiarism: false
  });
  const [feedback, setFeedback] = useState('');

  const allChecked = Object.values(checklist).every(Boolean);

  const handleApprove = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    try {
      if (id && id !== 'demo') {
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, {
          status: 'completed',
          approvedAt: new Date().toISOString(),
          editorId: user?.uid
        });
      }
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback) return;
    setSubmitting(true);
    try {
      if (id && id !== 'demo') {
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, {
          status: 'revision',
          editorFeedback: feedback,
          rejectedAt: new Date().toISOString(),
          editorId: user?.uid
        });
      }
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <span className="mono-label text-primary">QA Environment</span>
        <h1 className="text-3xl font-bold mt-2">QA Review: Macroeconomics Final Essay</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md font-bold">
            IN REVIEW
          </span>
          <span className="text-sm text-muted-foreground">
            Specialist: Dr. Sarah Jenkins
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bento-card p-0 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <span className="font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Submitted Document View
              </span>
              <a href="#" className="text-sm text-primary hover:underline flex items-center gap-1">
                Open in Google Docs <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="flex-1 bg-background/50 flex items-center justify-center text-muted-foreground p-8 text-center border-2 border-dashed border-border/50 m-4 rounded-lg">
              <div>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Google Docs iFrame would render here.</p>
                <p className="text-sm mt-2 opacity-70">Requires Google Workspace API integration for live preview.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bento-card p-6 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary relative z-10">
              <ShieldCheck className="w-5 h-5" />
              QA Checklist
            </h3>
            
            <div className="space-y-4 relative z-10">
              {Object.entries({
                formatting: 'Formatting & Structure',
                citations: 'Citations & References',
                tone: 'Academic Tone & Flow',
                plagiarism: 'Plagiarism Check Passed'
              }).map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    checklist[key as keyof typeof checklist] 
                      ? 'bg-primary border-primary text-white' 
                      : 'border-border group-hover:border-primary/50'
                  }`}>
                    {checklist[key as keyof typeof checklist] && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-sm select-none transition-colors ${
                    checklist[key as keyof typeof checklist] ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checklist[key as keyof typeof checklist]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="bento-card p-6">
            <h3 className="font-bold mb-4">Editor Decision</h3>
            
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback if rejecting, or optional notes if approving..."
              className="w-full p-3 mb-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-y"
            />
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleApprove}
                disabled={!allChecked || submitting}
                className="w-full py-3 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 disabled:hover:bg-green-500/10 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Processing...' : 'Approve & Finalize'}
              </button>
              
              <button
                onClick={handleReject}
                disabled={!feedback || submitting}
                className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:hover:bg-red-500/10 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {submitting ? 'Processing...' : 'Request Revisions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
