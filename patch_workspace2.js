import fs from 'fs';
let code = fs.readFileSync('src/pages/ProjectWorkspace.tsx', 'utf8');

const importSearch = "import { motion, AnimatePresence } from 'motion/react';";
const newImport = "import { motion, AnimatePresence } from 'motion/react';\nimport ProjectChat from '../components/ProjectChat';";
code = code.replace(importSearch, newImport);

const stateSearch = "const [revisionNotes, setRevisionNotes] = useState('');";
const newState = "const [revisionNotes, setRevisionNotes] = useState('');\n  const [isChatOpen, setIsChatOpen] = useState(false);";
code = code.replace(stateSearch, newState);

const uiSearch = `          <div className="bento-card p-6 border-primary/20 bg-primary/5">
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
          </div>`;

const newUI = `          {isChatOpen ? (
            <ProjectChat projectId={id!} onClose={() => setIsChatOpen(false)} />
          ) : (
            <div className="bento-card p-6 border-primary/20 bg-primary/5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Communication
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Need to clarify requirements? Use the workspace chat to talk directly.
              </p>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full py-2 bg-background border border-primary/30 rounded-md text-sm font-medium hover:border-primary transition-colors text-primary flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Open Chat
              </button>
            </div>
          )}`;
code = code.replace(uiSearch, newUI);

fs.writeFileSync('src/pages/ProjectWorkspace.tsx', code);
console.log('patched workspace with chat');
