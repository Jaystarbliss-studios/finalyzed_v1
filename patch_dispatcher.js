import fs from 'fs';
let code = fs.readFileSync('src/pages/DashboardDispatcher.tsx', 'utf8');

// Replace the entire if (!userData) block with a Navigate to /onboarding
const blockStart = code.indexOf('  // If userData is completely null (no document exists), show Onboarding');
const blockEnd = code.lastIndexOf('  return <StudentDashboard />;');

if (blockStart !== -1 && blockEnd !== -1) {
  const newCode = code.substring(0, blockStart) + '  if (!userData) {\n    return <Navigate to="/onboarding" replace />;\n  }\n\n' + code.substring(blockEnd);
  fs.writeFileSync('src/pages/DashboardDispatcher.tsx', newCode);
  console.log('patched');
} else {
  console.log('could not find block');
}
