const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import AdminDashboard from './pages/AdminDashboard';", "import AdminDashboard from './pages/AdminDashboard';\nimport Onboarding from './pages/Onboarding';");
app = app.replace("<Route path=\"/dashboard\" element={<DashboardDispatcher />} />", "<Route path=\"/dashboard\" element={<DashboardDispatcher />} />\n            <Route path=\"/onboarding\" element={<Onboarding />} />");
fs.writeFileSync('src/App.tsx', app);
