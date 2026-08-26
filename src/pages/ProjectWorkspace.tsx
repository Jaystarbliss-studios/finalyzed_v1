import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Link as LinkIcon, Send, Clock, CheckCircle, Upload, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [driveLink, setDriveLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmitWork = async () => {
    if (!driveLink) return;
    setSubmitting(true);
    try {
      if (id && id !== 'demo') {
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, {
          status: 'review',
          driveLink,
          specialistNotes: notes,
          submittedAt: new Date().toISOString()
        });
      }
      // Demo fallback or success
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <span className="mono-label text-blue-400">Workspace</span>
        <h1 className="text-3xl font-bold mt-2">Project: Macroeconomics Final Essay</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">
            IN PROGRESS
          </span>
          <span className="text-sm flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" /> Due in 24 hours
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bento-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              Submit Completed Work
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Please paste the Google Drive link to your finalized document. Ensure the sharing settings are set to "Anyone with the link can comment".
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Drive URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <input
                    type="url"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes for Editor (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention any specific areas you want the QA editor to focus on..."
                  className="w-full p-4 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-y"
                />
              </div>

              <button
                onClick={handleSubmitWork}
                disabled={!driveLink || submitting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for QA Review'}
                {!submitting && <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bento-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Project Details
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Type</span>
                <p className="font-medium text-sm mt-1">Research Essay</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Length</span>
                <p className="font-medium text-sm mt-1">3,000 words</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Plan</span>
                <p className="font-medium text-sm mt-1 text-yellow-400">Deep Review</p>
              </div>
            </div>
          </div>

          <div className="bento-card p-6 border-primary/20 bg-primary/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Need clarification?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              If the instructions are unclear, you can request clarification from the student. This will pause the timer.
            </p>
            <button className="w-full py-2 bg-background border border-border rounded-md text-sm font-medium hover:border-primary transition-colors">
              Request Clarification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
