import fs from 'fs';
let code = fs.readFileSync('src/pages/SpecialistProfile.tsx', 'utf8');

const linkStr = '<Link to="/start-project" className="btn-primary px-8 py-3 text-center text-lg flex-1 md:flex-none">';
const btnStr = '<button onClick={() => { localStorage.setItem(\'finalyzed_selected_specialist\', specialist.id); window.location.href = \'/start-project\'; }} className="btn-primary px-8 py-3 text-center text-lg flex-1 md:flex-none">Start Project</button>';

code = code.replace(linkStr + '\n                    Start Project\n                  </Link>', btnStr);
fs.writeFileSync('src/pages/SpecialistProfile.tsx', code);
console.log('patched specialist profile');
