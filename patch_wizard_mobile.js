import fs from 'fs';
let code = fs.readFileSync('src/pages/ProjectWizard.tsx', 'utf8');

// Replace top navigation sidebar with a mobile-friendly progress indicator that appears at the top on small screens
const sidebarHtml = `
        {/* Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-1 border-r border-border pr-6">
`;
const mobileProgress = `
        {/* Mobile Progress Indicator */}
        <div className="lg:hidden col-span-1 mb-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
            <span className="text-primary truncate ml-4">{WIZARD_STEPS[currentStep]}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
            {WIZARD_STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={\`h-full flex-1 \${idx === currentStep ? 'bg-primary' : idx < currentStep ? 'bg-primary/50' : 'bg-transparent'} \${idx < WIZARD_STEPS.length - 1 ? 'border-r border-background' : ''}\`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-1 border-r border-border pr-6">
`;
code = code.replace(sidebarHtml, mobileProgress);

// Also reduce padding for mobile
code = code.replace('className="bg-background border border-border rounded-xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col justify-between"', 'className="bg-background border border-border rounded-xl p-4 md:p-8 shadow-sm min-h-[400px] flex flex-col justify-between"');
code = code.replace('className="w-full max-w-5xl mx-auto px-4 py-12"', 'className="w-full max-w-5xl mx-auto px-4 py-6 md:py-12"');
code = code.replace('className="mb-12 flex justify-between items-center"', 'className="mb-6 md:mb-12 flex justify-between items-center"');


fs.writeFileSync('src/pages/ProjectWizard.tsx', code);
console.log('patched wizard');
