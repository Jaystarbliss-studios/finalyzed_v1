import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStr = "import { Feather, Menu, X, ArrowRight, CheckCircle, Shield, Briefcase, ChevronRight } from 'lucide-react';";
const newImportStr = "import { Feather, Menu, X, ArrowRight, CheckCircle, Shield, Briefcase, ChevronRight, Home as HomeIcon, Search, User, Compass } from 'lucide-react';\nimport { useLocation } from 'react-router-dom';";
code = code.replace(importStr, newImportStr);

const layoutStart = code.indexOf('function Layout({ children }: { children: React.ReactNode }) {');
const endOfLayout = code.indexOf('export default function App() {');

let layoutCode = code.substring(layoutStart, endOfLayout);

// Find the footer return part
const footerStr = '<footer className="bg-background text-foreground border-t border-border py-12 mt-auto">';
const returnPart = layoutCode.indexOf(footerStr);

const locationHook = "  const location = useLocation();\n  const isMobileNavVisible = user && !location.pathname.includes('/workspace') && !location.pathname.includes('/qa-workspace');\n";
layoutCode = layoutCode.replace("  const navigate = useNavigate();", "  const navigate = useNavigate();\n" + locationHook);

const bottomNav = `
      {isMobileNavVisible && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 px-4 py-2 flex justify-between items-center safe-area-bottom">
          <Link to="/dashboard" className={\`flex flex-col items-center p-2 \${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}\`}>
            <HomeIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link to="/specialists" className={\`flex flex-col items-center p-2 \${location.pathname === '/specialists' ? 'text-primary' : 'text-muted-foreground'}\`}>
            <Search className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          <Link to="/start-project" className="flex flex-col items-center p-2 text-primary -mt-6">
            <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/30">
              <Feather className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium mt-1">New</span>
          </Link>
          <Link to="/knowledge-base" className={\`flex flex-col items-center p-2 \${location.pathname === '/knowledge-base' ? 'text-primary' : 'text-muted-foreground'}\`}>
            <Compass className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Knowledge</span>
          </Link>
          <Link to="/wallet" className={\`flex flex-col items-center p-2 \${location.pathname === '/wallet' ? 'text-primary' : 'text-muted-foreground'}\`}>
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Wallet</span>
          </Link>
        </div>
      )}
`;

layoutCode = layoutCode.replace(footerStr, bottomNav + '\n      <footer className="bg-background text-foreground border-t border-border py-12 mt-auto hidden md:block">');
layoutCode = layoutCode.replace('<main className="flex-1 w-full max-w-7xl mx-auto">', '<main className="flex-1 w-full max-w-7xl mx-auto pb-20 md:pb-0">');

code = code.substring(0, layoutStart) + layoutCode + code.substring(endOfLayout);
fs.writeFileSync('src/App.tsx', code);
console.log('patched app');
