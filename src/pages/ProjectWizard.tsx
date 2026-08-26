import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WIZARD_STEPS = [
  "Student Info",
  "Project Identity",
  "Institution Requirements",
  "Formatting",
  "Page & Length",
  "Structure",
  "Citation & References",
  "Methodology",
  "Data & Results",
  "Appendices",
  "Presentation",
  "Special Instructions",
  "Confirmation"
];

export default function ProjectWizard() {
  const { user, userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSaved, setIsSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('finalyzed_project_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    } else if (userData?.studentProfile) {
      setFormData((prev: any) => ({
        ...prev,
        fullName: userData.name || '',
        institution: userData.studentProfile.institution || '',
        faculty: userData.studentProfile.faculty || '',
        department: userData.studentProfile.department || '',
        degree: userData.studentProfile.degree || '',
        matricNumber: userData.studentProfile.matricNumber || '',
      }));
    }
  }, [userData]);

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem('finalyzed_project_draft', JSON.stringify(formData));
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handleUpdate = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleConfirm = () => {
    if (!confirmed) return;
    localStorage.setItem('finalyzed_project_confirmed', JSON.stringify(formData));
    navigate('/checkout');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">1. Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Full Name" value={formData.fullName || ''} onChange={(e) => handleUpdate('fullName', e.target.value)} className="form-input" />
              <input placeholder="Matriculation/Registration No." value={formData.matricNumber || ''} onChange={(e) => handleUpdate('matricNumber', e.target.value)} className="form-input" />
              <input placeholder="Institution" value={formData.institution || ''} onChange={(e) => handleUpdate('institution', e.target.value)} className="form-input" />
              <input placeholder="Faculty/School" value={formData.faculty || ''} onChange={(e) => handleUpdate('faculty', e.target.value)} className="form-input" />
              <input placeholder="Department" value={formData.department || ''} onChange={(e) => handleUpdate('department', e.target.value)} className="form-input" />
              <input placeholder="Degree/Award (e.g. B.Sc)" value={formData.degree || ''} onChange={(e) => handleUpdate('degree', e.target.value)} className="form-input" />
              <input placeholder="Project Supervisor" value={formData.supervisor || ''} onChange={(e) => handleUpdate('supervisor', e.target.value)} className="form-input" />
              <input placeholder="Head of Department" value={formData.hod || ''} onChange={(e) => handleUpdate('hod', e.target.value)} className="form-input" />
              <div className="flex gap-4">
                <input placeholder="Submission Month (e.g. August)" value={formData.submissionMonth || ''} onChange={(e) => handleUpdate('submissionMonth', e.target.value)} className="form-input w-1/2" />
                <input placeholder="Year (e.g. 2026)" value={formData.submissionYear || ''} onChange={(e) => handleUpdate('submissionYear', e.target.value)} className="form-input w-1/2" />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">2. Project Identity</h3>
            <input placeholder="Exact Approved Project Title" value={formData.projectTitle || ''} onChange={(e) => handleUpdate('projectTitle', e.target.value)} className="form-input" />
            <select value={formData.projectType || ''} onChange={(e) => handleUpdate('projectType', e.target.value)} className="form-input">
              <option value="">Select Project Type</option>
              <option value="Design & Construction">Design & Construction</option>
              <option value="Research Study">Research Study</option>
              <option value="Software Development">Software Development</option>
              <option value="Case Study">Case Study</option>
              <option value="Business Plan">Business Plan</option>
              <option value="Survey-Based Study">Survey-Based Study</option>
              <option value="Other">Other</option>
            </select>
            <input placeholder="Core Subject Area" value={formData.subjectArea || ''} onChange={(e) => handleUpdate('subjectArea', e.target.value)} className="form-input" />
            <textarea placeholder="What problem is being addressed?" value={formData.problemStatement || ''} onChange={(e) => handleUpdate('problemStatement', e.target.value)} className="form-input min-h-[100px]" />
            <textarea placeholder="Expected Outcome / Objectives" value={formData.expectedOutcome || ''} onChange={(e) => handleUpdate('expectedOutcome', e.target.value)} className="form-input min-h-[100px]" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.topicApproved || false} onChange={(e) => handleUpdate('topicApproved', e.target.checked)} className="w-4 h-4" />
              <span>Is this topic officially approved by your department?</span>
            </label>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">3. Institution Requirements</h3>
            <select value={formData.hasPrescribedFormat || ''} onChange={(e) => handleUpdate('hasPrescribedFormat', e.target.value)} className="form-input">
              <option value="">Does your institution have a prescribed project format?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">I don't know</option>
            </select>
            {formData.hasPrescribedFormat === 'Yes' && (
              <textarea placeholder="Detail the specific requirements (or you can upload documents on the dashboard later)" value={formData.prescribedFormatDetails || ''} onChange={(e) => handleUpdate('prescribedFormatDetails', e.target.value)} className="form-input min-h-[100px]" />
            )}
            <textarea placeholder="List required preliminary pages (e.g. Dedication, Abstract, Certification)" value={formData.preliminaryPages || ''} onChange={(e) => handleUpdate('preliminaryPages', e.target.value)} className="form-input min-h-[100px]" />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">4. Formatting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.fontFamily || ''} onChange={(e) => handleUpdate('fontFamily', e.target.value)} className="form-input">
                <option value="">Font Family</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Calibri">Calibri</option>
                <option value="Institution Standard">Institution Standard</option>
              </select>
              <select value={formData.lineSpacing || ''} onChange={(e) => handleUpdate('lineSpacing', e.target.value)} className="form-input">
                <option value="">Line Spacing</option>
                <option value="1.0">1.0</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
                <option value="Institution Standard">Institution Standard</option>
              </select>
              <input placeholder="Body Font Size (e.g. 12pt)" value={formData.bodyFontSize || ''} onChange={(e) => handleUpdate('bodyFontSize', e.target.value)} className="form-input" />
              <input placeholder="Heading Font Size (e.g. 14pt)" value={formData.headingFontSize || ''} onChange={(e) => handleUpdate('headingFontSize', e.target.value)} className="form-input" />
              <select value={formData.alignment || ''} onChange={(e) => handleUpdate('alignment', e.target.value)} className="form-input">
                <option value="">Alignment</option>
                <option value="Justified">Justified</option>
                <option value="Left">Left</option>
              </select>
              <input placeholder="Margins (e.g. Top 1, Bottom 1, Left 1.5, Right 1)" value={formData.margins || ''} onChange={(e) => handleUpdate('margins', e.target.value)} className="form-input" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">5. Page & Length</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Minimum Pages" type="number" value={formData.minPages || ''} onChange={(e) => handleUpdate('minPages', e.target.value)} className="form-input" />
              <input placeholder="Target Pages" type="number" value={formData.targetPages || ''} onChange={(e) => handleUpdate('targetPages', e.target.value)} className="form-input" />
              <input placeholder="Maximum Pages" type="number" value={formData.maxPages || ''} onChange={(e) => handleUpdate('maxPages', e.target.value)} className="form-input" />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.countPrelim || false} onChange={(e) => handleUpdate('countPrelim', e.target.checked)} className="w-4 h-4" />
                <span>Do preliminary pages count towards total?</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.countReferences || false} onChange={(e) => handleUpdate('countReferences', e.target.checked)} className="w-4 h-4" />
                <span>Do references count towards total?</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.countAppendices || false} onChange={(e) => handleUpdate('countAppendices', e.target.checked)} className="w-4 h-4" />
                <span>Do appendices count towards total?</span>
              </label>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">6. Structure</h3>
            <input placeholder="Total Number of Chapters" type="number" value={formData.chapterCount || ''} onChange={(e) => handleUpdate('chapterCount', e.target.value)} className="form-input" />
            <div className="space-y-3">
              <input placeholder="Chapter 1 Title (e.g. Introduction)" value={formData.chapter1Title || ''} onChange={(e) => handleUpdate('chapter1Title', e.target.value)} className="form-input" />
              <input placeholder="Chapter 2 Title (e.g. Literature Review)" value={formData.chapter2Title || ''} onChange={(e) => handleUpdate('chapter2Title', e.target.value)} className="form-input" />
              <input placeholder="Chapter 3 Title (e.g. Methodology)" value={formData.chapter3Title || ''} onChange={(e) => handleUpdate('chapter3Title', e.target.value)} className="form-input" />
              <input placeholder="Chapter 4 Title (e.g. Implementation / Results)" value={formData.chapter4Title || ''} onChange={(e) => handleUpdate('chapter4Title', e.target.value)} className="form-input" />
              <input placeholder="Chapter 5 Title (e.g. Conclusion and Recommendations)" value={formData.chapter5Title || ''} onChange={(e) => handleUpdate('chapter5Title', e.target.value)} className="form-input" />
            </div>
            <textarea placeholder="List any mandatory subsections" value={formData.mandatorySubsections || ''} onChange={(e) => handleUpdate('mandatorySubsections', e.target.value)} className="form-input min-h-[80px]" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">7. Citation & References</h3>
            <select value={formData.citationStyle || ''} onChange={(e) => handleUpdate('citationStyle', e.target.value)} className="form-input">
              <option value="">Select Citation Style</option>
              <option value="APA">APA</option>
              <option value="IEEE">IEEE</option>
              <option value="Harvard">Harvard</option>
              <option value="MLA">MLA</option>
              <option value="Vancouver">Vancouver</option>
              <option value="Other">Other (Specify in instructions)</option>
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Minimum References" type="number" value={formData.minReferences || ''} onChange={(e) => handleUpdate('minReferences', e.target.value)} className="form-input" />
              <input placeholder="Maximum References (if applicable)" type="number" value={formData.maxReferences || ''} onChange={(e) => handleUpdate('maxReferences', e.target.value)} className="form-input" />
            </div>
            <textarea placeholder="Specify any requirements regarding source types (e.g. must include 5 recent textbooks, no Wikipedia, focus on journals from 2020+)" value={formData.sourceRequirements || ''} onChange={(e) => handleUpdate('sourceRequirements', e.target.value)} className="form-input min-h-[100px]" />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">8. Methodology</h3>
            <p className="text-sm text-muted-foreground">Describe how the project should be executed.</p>
            <textarea placeholder="Research Design / Architecture / Methodology details" value={formData.methodology || ''} onChange={(e) => handleUpdate('methodology', e.target.value)} className="form-input min-h-[100px]" />
            <input placeholder="Required Technologies / Instruments" value={formData.technologies || ''} onChange={(e) => handleUpdate('technologies', e.target.value)} className="form-input" />
            <input placeholder="Target Population / Scope" value={formData.scope || ''} onChange={(e) => handleUpdate('scope', e.target.value)} className="form-input" />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">9. Data & Results</h3>
            <select value={formData.hasRealData || ''} onChange={(e) => handleUpdate('hasRealData', e.target.value)} className="form-input">
              <option value="">Do you already have real project data?</option>
              <option value="Yes">Yes (I will upload to workspace)</option>
              <option value="No">No (Use illustrative data)</option>
              <option value="Partial">Partial</option>
            </select>
            <textarea placeholder="Describe expected results, required charts, tables, diagrams, or technical drawings." value={formData.resultRequirements || ''} onChange={(e) => handleUpdate('resultRequirements', e.target.value)} className="form-input min-h-[100px]" />
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">10. Appendices</h3>
            <p className="text-sm text-muted-foreground">Select required appendices.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Questionnaire", "Interview Questions", "Test Log", 
                "Bill of Materials", "Budget", "Code Listing", 
                "Technical Drawings", "Financial Statements"
              ].map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.appendices?.includes(item) || false} 
                    onChange={(e) => {
                      const current = formData.appendices || [];
                      if (e.target.checked) handleUpdate('appendices', [...current, item]);
                      else handleUpdate('appendices', current.filter((i: string) => i !== item));
                    }} 
                    className="w-4 h-4" 
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <input placeholder="Other Appendices" value={formData.otherAppendices || ''} onChange={(e) => handleUpdate('otherAppendices', e.target.value)} className="form-input" />
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">11. Presentation</h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.presentationRequired || false} onChange={(e) => handleUpdate('presentationRequired', e.target.checked)} className="w-4 h-4" />
              <span className="font-medium">Is a presentation required? (Available on Standard/Premium plans)</span>
            </label>
            {formData.presentationRequired && (
              <>
                <input placeholder="Required Slide Count (e.g. 15-20)" value={formData.slideCount || ''} onChange={(e) => handleUpdate('slideCount', e.target.value)} className="form-input" />
                <textarea placeholder="Defence requirements, format, or likely questions" value={formData.defenceRequirements || ''} onChange={(e) => handleUpdate('defenceRequirements', e.target.value)} className="form-input min-h-[80px]" />
              </>
            )}
          </div>
        );
      case 11:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">12. Special Instructions</h3>
            <textarea placeholder="Provide any other specific instructions from your supervisor, department, or yourself. What must the specialist NOT change?" value={formData.specialInstructions || ''} onChange={(e) => handleUpdate('specialInstructions', e.target.value)} className="form-input min-h-[150px]" />
          </div>
        );
      case 12:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center">13. Specification Summary</h3>
            <div className="bento-card p-6 bg-muted/20 border-border max-h-[400px] overflow-y-auto">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><dt className="font-bold text-muted-foreground">Title</dt><dd className="font-medium">{formData.projectTitle || 'N/A'}</dd></div>
                <div><dt className="font-bold text-muted-foreground">Institution</dt><dd className="font-medium">{formData.institution || 'N/A'}</dd></div>
                <div><dt className="font-bold text-muted-foreground">Project Type</dt><dd className="font-medium">{formData.projectType || 'N/A'}</dd></div>
                <div><dt className="font-bold text-muted-foreground">Target Pages</dt><dd className="font-medium">{formData.targetPages || 'N/A'}</dd></div>
                <div><dt className="font-bold text-muted-foreground">Citation Style</dt><dd className="font-medium">{formData.citationStyle || 'N/A'}</dd></div>
                <div><dt className="font-bold text-muted-foreground">Chapters</dt><dd className="font-medium">{formData.chapterCount || 'N/A'}</dd></div>
                <div className="md:col-span-2"><dt className="font-bold text-muted-foreground">Methodology</dt><dd className="font-medium">{formData.methodology || 'N/A'}</dd></div>
              </dl>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  I have reviewed the project specifications supplied above and confirm that they accurately represent my requirements. I understand that modifying these post-payment may incur additional charges or delays.
                </span>
              </label>
            </div>
            <button 
              onClick={handleConfirm}
              disabled={!confirmed}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Specification & Proceed to Checkout
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Specification</h1>
          <p className="text-muted-foreground">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaved ? <span className="flex items-center gap-1 text-green-500"><Check className="w-4 h-4" /> Saved</span> : <span className="flex items-center gap-1"><Save className="w-4 h-4" /> Autosaving...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-1 border-r border-border pr-6">
          <nav className="space-y-1 relative">
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = currentStep === idx;
              const isPast = currentStep > idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between ${
                    isActive ? 'bg-primary text-white font-bold shadow-sm' :
                    isPast ? 'text-foreground hover:bg-muted' : 'text-muted-foreground opacity-50'
                  }`}
                >
                  {step}
                  {isPast && <Check className="w-4 h-4 text-green-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Content */}
        <div className="col-span-1 lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-background border border-border rounded-xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col justify-between"
            >
              <div className="flex-1">
                {renderStepContent()}
              </div>
              
              {/* Footer Controls */}
              {currentStep < WIZARD_STEPS.length - 1 && (
                <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="px-6 py-2 rounded-lg font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="btn-primary px-8 py-2 flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .form-input {
          @apply w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all;
        }
      `}} />
    </div>
  );
}
