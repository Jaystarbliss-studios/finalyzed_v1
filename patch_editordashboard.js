import fs from 'fs';
let code = fs.readFileSync('src/pages/EditorDashboard.tsx', 'utf8');

const queryReplace = `        const q = query(
          collection(db, 'projects'),
          where('status', '==', 'review'),
          orderBy('updatedAt', 'desc')
        );`;
const newQuery = `        const q = query(
          collection(db, 'projects'),
          where('status', '==', 'EDITOR_REVIEWING')
        );`;
code = code.replace(queryReplace, newQuery);

const fallbackReplace = `        // Fallback for demo
        setPendingReviews([
          {
            id: 'demo',
            title: 'Macroeconomics Final Essay',
            specialistId: 'sp-1',
            studentId: 'st-1',
            status: 'review',
            updatedAt: new Date().toISOString(),
            plan: 'standard'
          }
        ]);`;
const newFallback = `        // Fallback for demo
        if (reviews.length === 0) {
          // just mock data if empty in db for UI testing
          setPendingReviews([]);
        }`;
code = code.replace(fallbackReplace, newFallback);

// Also need to ensure we map correctly on the pendingReviews loop below
// Let's replace the mock data entirely

fs.writeFileSync('src/pages/EditorDashboard.tsx', code);
console.log('patched editor dashboard');
