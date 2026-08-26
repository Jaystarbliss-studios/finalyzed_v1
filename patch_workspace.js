import fs from 'fs';

const newCode = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Link as LinkIcon, Send, Clock, CheckCircle, Upload, MessageSquare, AlertCircle, FileCheck, ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Specialist states
  const [driveLink, setDriveLink] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Student states
  const [revisionNotes, setRevisionNotes] = useState('');

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

  const handleSubmitWork = async () => {
    if (!driveLink || !project || !id) return;
    setSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        status: 'EDITOR_REVIEWING',
        driveLink,
        specialistNotes: notes,
        submittedAt: serverTimestamp()
      });
      // Refresh local state
      setProject({ ...project, status: 'EDITOR_REVIEWING', driveLink, specialistNotes: notes });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentAccept = async () => {
    if (!project || !id) return;
    try {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        status: 'COMPLETED',
        completedAt: serverTimestamp()
      });
      setProject({ ...project, status: 'COMPLETED' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentRevision = async () => {
    if (!project || !id || !revisionNotes) return;
    try {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        status: 'EDITOR_REVIEWING', // Goes back to Editor first to manage the revision
        revisionNotes: revisionNotes,
        revisionRequestedAt: serverTimestamp()
      });
      setProject({ ...project, status: 'EDITOR_REVIEWING', revisionNotes });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading workspace...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  const isStudent = user?.uid === project.studentId;
  const isSpecialist = user?.uid === project.specialistId;
  const isEditor = userData?.role === 'editor'; // Future proofing

  // Format status for display
  const displayStatus = project.status.replace(/_/g, ' ');
  const spec = project.specification || {};

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
      
      <header className="mb-6 md:mb-8 border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <span className="mono-label text-primary flex items-center gap-2">
              Workspace <span className="text-muted-foreground hidden md:inline">• ID: {project.id.slice(0,8)}</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">{project.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-bold uppercase tracking-wider">
              {displayStatus}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* Main Action Area */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* SPECIALIST VIEW: Submit Work */}
          {isSpecialist && project.status === 'PAYMENT_CONFIRMED' && (
            <div className="bento-card p-6 md:p-8 border-primary/30 shadow-lg shadow-primary/5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-primary" />
                Submit Completed Work
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Paste the Google Drive link to your finalized document. Ensure sharing is set to "Anyone with the link can comment".
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
                    className="w-full p-4 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-y"
                  />
                </div>
                <button
                  onClick={handleSubmitWork}
                  disabled={!driveLink || submitting}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-base"
                >
                  {submitting ? 'Submitting...' : 'Submit to Quality Assurance'}
                  {!submitting && <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* SPECIALIST VIEW: Waiting for Editor */}
          {isSpecialist && project.status === 'EDITOR_REVIEWING' && (
            <div className="bento-card p-8 flex flex-col items-center justify-center text-center border-yellow-500/20 bg-yellow-500/5">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">In Quality Assurance</h3>
              <p className="text-muted-foreground max-w-md">
                Your work has been submitted and is currently being reviewed by a Finalyzed Editor. You will be notified if revisions are required.
              </p>
            </div>
          )}

          {/* STUDENT VIEW: Waiting for Specialist/Editor */}
          {isStudent && ['PAYMENT_CONFIRMED', 'EDITOR_REVIEWING'].includes(project.status) && (
            <div className="bento-card p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full opacity-50"
                />
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Work in Progress</h3>
              <p className="text-muted-foreground max-w-md">
                {project.status === 'PAYMENT_CONFIRMED' 
                  ? "Your specialist is actively working on your project." 
                  : "Your project is currently undergoing expert Quality Assurance."}
              </p>
              <div className="mt-8 w-full max-w-md bg-muted rounded-full h-2 overflow-hidden">
                <motion.div 
                  initial={{ width: "20%" }}
                  animate={{ width: project.status === 'EDITOR_REVIEWING' ? "75%" : "40%" }}
                  className="bg-primary h-full rounded-full"
                />
              </div>
            </div>
          )}

          {/* STUDENT VIEW: Work Delivered */}
          {isStudent && ['AVAILABLE_TO_STUDENT', 'COMPLETED'].includes(project.status) && (
            <div className="flex flex-col gap-6">
              <div className="bento-card p-6 md:p-8 border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/5">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-green-500">
                      <FileCheck className="w-6 h-6" />
                      Project Delivered
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Your project has passed QA and is ready for your review.
                    </p>
                  </div>
                  <a 
                    href={project.driveLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-primary bg-green-600 hover:bg-green-700 w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Access Document
                  </a>
                </div>
              </div>

              {project.status === 'AVAILABLE_TO_STUDENT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bento-card p-6">
                    <h3 className="font-bold mb-2">Approve Project</h3>
                    <p className="text-xs text-muted-foreground mb-4">Accept the delivery to release funds and close the project.</p>
                    <button onClick={handleStudentAccept} className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-light transition-colors">
                      Accept Delivery
                    </button>
                  </div>
                  <div className="bento-card p-6 border-red-500/20">
                    <h3 className="font-bold mb-2">Request Revision</h3>
                    <p className="text-xs text-muted-foreground mb-4">Request specific changes (subject to remaining revisions).</p>
                    <textarea 
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="What needs changing?"
                      className="w-full p-3 text-sm bg-background border border-border rounded-lg mb-3 h-20 resize-none"
                    />
                    <button 
                      onClick={handleStudentRevision}
                      disabled={!revisionNotes}
                      className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Submit Revision
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* COMPLETED STATE */}
          {project.status === 'COMPLETED' && (
            <div className="bento-card p-6 bg-primary/5 border-primary/20 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-bold">Project Completed Successfully</h3>
                <p className="text-sm text-muted-foreground">This project is closed and funds have been released.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar details */}
        <div className="flex flex-col gap-6">
          <div className="bento-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Specification Snapshot
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
            <button className="w-full mt-6 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors">
              View Full Specification
            </button>
          </div>

          <div className="bento-card p-6 border-primary/20 bg-primary/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Communication
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Need to clarify requirements? Use the workspace chat to talk directly.
            </p>
            <button className="w-full py-2 bg-background border border-primary/30 rounded-md text-sm font-medium hover:border-primary transition-colors text-primary flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Open Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/ProjectWorkspace.tsx', newCode);
console.log('patched project workspace');
