import fs from 'fs';
let code = fs.readFileSync('src/pages/SpecialistDashboard.tsx', 'utf8');

// Just fixing the padding for mobile on the main wrapper
code = code.replace('className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-full gap-6"', 'className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col h-full gap-6"');
code = code.replace('className="flex justify-between items-end mb-2"', 'className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4"');

fs.writeFileSync('src/pages/SpecialistDashboard.tsx', code);
console.log('patched specialist dashboard');
