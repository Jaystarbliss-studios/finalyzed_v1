import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const WIZARD_STEPS = [
  "Student Info",
  "Project Identity",
  "School Req.",
  "Formatting",
  "Length & Struct",
  "Citation",
  "Methodology",
  "Confirmation"
];

export default function ProjectWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  // Load drafted data
  useEffect(() => {
    const saved = localStorage.getItem('finalyzed_project_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Autosave
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem('finalyzed_project_draft', JSON.stringify(formData));
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handleUpdate = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-80px)]">
      <header className="flex justify-between items-end mb-6 shrink-0">
        <div className="flex flex-col">
          <span className="mono-label">Project Initialization</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-2 h-6 bg-primary"></div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              SPECIFICATION.<span className="opacity-50 font-light">ENGINE</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Autosave</span>
            {isSaved ? (
              <span className="text-green-400">Synced</span>
            ) : (
              <span className="text-muted-foreground">Waiting</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 bento-card p-0 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 border-r border-border bg-background/50 flex flex-col overflow-y-auto">
          <div className="p-6 pb-2">
            <span className="mono-label">Progress Matrix</span>
          </div>
          <div className="flex-1 py-4">
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-white/5 border-r-2 border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-primary text-background font-bold ' :
                    isPast ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-muted border border-border text-muted-foreground'
                  }`}>
                    {isPast ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden relative">
          <div className="bento-glow"></div>
          
          <div className="flex-1 overflow-y-auto p-8 lg:p-12 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <div className="mb-8">
                  <span className="mono-label">Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
                  <h2 className="text-3xl font-light tracking-tight text-foreground mt-2">{WIZARD_STEPS[currentStep]}</h2>
                </div>

                {/* Step 0: Student Info */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Full Name</label>
                        <input 
                          type="text"
                          value={formData.fullName || ''}
                          onChange={(e) => handleUpdate('fullName', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Matriculation Number</label>
                        <input 
                          type="text"
                          value={formData.matricNumber || ''}
                          onChange={(e) => handleUpdate('matricNumber', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="e.g. 19/MAC/001"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Institution</label>
                      <input 
                        type="text"
                        value={formData.institution || ''}
                        onChange={(e) => handleUpdate('institution', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="University Name"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Faculty / School</label>
                        <input 
                          type="text"
                          value={formData.faculty || ''}
                          onChange={(e) => handleUpdate('faculty', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="e.g. Science"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Department</label>
                        <input 
                          type="text"
                          value={formData.department || ''}
                          onChange={(e) => handleUpdate('department', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Project Identity */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Exact Project Title</label>
                      <textarea 
                        value={formData.projectTitle || ''}
                        onChange={(e) => handleUpdate('projectTitle', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]"
                        placeholder="Type the approved project topic here..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Project Type</label>
                      <select 
                        value={formData.projectType || ''}
                        onChange={(e) => handleUpdate('projectType', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                      >
                        <option value="">Select type...</option>
                        <option value="research">Research Study</option>
                        <option value="software">Software Development</option>
                        <option value="design">Design & Construction</option>
                        <option value="case-study">Case Study</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expected Outcome</label>
                      <textarea 
                        value={formData.expectedOutcome || ''}
                        onChange={(e) => handleUpdate('expectedOutcome', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]"
                        placeholder="What is the final goal of this project?"
                      />
                    </div>
                  </div>
                )}

                {/* Placeholders for Middle Steps to keep demo concise */}
                {currentStep > 1 && currentStep < WIZARD_STEPS.length - 1 && (
                  <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex gap-4 items-start">
                      <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <h3 className="text-foreground font-medium mb-1">Configuration Section</h3>
                        <p className="text-sm text-muted-foreground">In a production environment, this section collects specific detailed requirements for {WIZARD_STEPS[currentStep].toLowerCase()}.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Special Instructions for {WIZARD_STEPS[currentStep]}</label>
                      <textarea 
                        value={formData[`notes_${currentStep}`] || ''}
                        onChange={(e) => handleUpdate(`notes_${currentStep}`, e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[150px]"
                        placeholder="Enter any specific requirements..."
                      />
                    </div>
                  </div>
                )}

                {/* Final Step: Confirmation */}
                {currentStep === WIZARD_STEPS.length - 1 && (
                  <div className="space-y-8">
                    <div className="bg-background border border-border rounded-xl p-6">
                      <h3 className="text-lg font-medium text-foreground mb-4 border-b border-border pb-4">Project Specification Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-sm">Student</span>
                          <span className="col-span-2 text-foreground font-medium">{formData.fullName || 'Not provided'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-sm">Institution</span>
                          <span className="col-span-2 text-foreground font-medium">{formData.institution || 'Not provided'} ({formData.department || ''})</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-sm">Project Title</span>
                          <span className="col-span-2 text-foreground font-medium">{formData.projectTitle || 'Not provided'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pb-3">
                          <span className="text-muted-foreground text-sm">Project Type</span>
                          <span className="col-span-2 text-foreground font-medium capitalize">{formData.projectType || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <div className="mt-1">
                          <input type="checkbox" className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">
                          I have reviewed the project specifications supplied above and confirm that they accurately represent my requirements. I understand that significant changes after this point may require a new specification or additional revisions.
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => {
                           // Navigate to checkout passing the project title via state
                           const title = formData.documentType 
                             ? `${formData.documentType} for ${formData.courseCode || 'Course'}`
                             : 'Custom Academic Project';
                           navigate('/checkout', { state: { project: { title, type: formData.documentType || 'Commissioned Project' } } });
                         }}
                         className="btn-primary w-full py-4 text-lg"
                       >
                          Confirm Specification & Proceed to Payment
                       </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border bg-background/80 backdrop-blur-sm p-6 flex justify-between items-center z-10 shrink-0">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-secondary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="flex items-center gap-4">
              <button className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                Save & Exit
              </button>
              
              {currentStep < WIZARD_STEPS.length - 1 && (
                <button 
                  onClick={nextStep}
                  className="btn-primary px-6 py-2.5 flex items-center gap-2"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
