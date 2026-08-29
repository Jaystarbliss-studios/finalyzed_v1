import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu, X, Home as HomeIcon, Search, Feather, Compass, UserCheck, ShieldAlert, Wallet as WalletIcon, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import NotificationBell from './components/NotificationBell';
import Home from './pages/Home';
import DashboardDispatcher from './pages/DashboardDispatcher';
import Onboarding from './pages/Onboarding';
import ProjectWizard from './pages/ProjectWizard';
import Marketplace from './pages/Marketplace';
import SpecialistProfile from './pages/SpecialistProfile';
import ProjectWorkspace from './pages/ProjectWorkspace';
import QAWorkspace from './pages/QAWorkspace';
import Checkout from './pages/Checkout';
import HowItWorks from './pages/HowItWorks';
import KnowledgeBase from './pages/KnowledgeBase';
import AdminTemplates from './pages/AdminTemplates';
import AdminControlCenter from './pages/AdminControlCenter';
import BankDetails from './pages/BankDetails';
import Wallet from './pages/Wallet';
import AdminWallet from './pages/AdminWallet';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Finalyzed...</div>;
  }

  const role = userData?.role;
  const isAdmin = role === 'admin';
  const accessState = String(userData?.access_state || 'active');
  const isOnboarding = location.pathname === '/onboarding';
  const isPublic = ['/', '/login', '/how-it-works'].includes(location.pathname);

  if (user && ['suspended', 'banned'].includes(accessState)) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-5">
        <div className="max-w-md w-full rounded-2xl border border-border bg-background p-6 text-center shadow-xl">
          <ShieldAlert className="w-10 h-10 mx-auto text-amber-500" />
          <h1 className="text-xl font-bold mt-3">Account access {accessState}</h1>
          <p className="text-sm text-muted-foreground mt-2">Your Finalyzed account cannot use platform services right now.</p>
          <button onClick={logout} className="btn-secondary mt-5 px-5 py-2">Log out</button>
        </div>
      </div>
    );
  }

  if (user && !isAdmin && userData && !userData.onboardingComplete && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isOnboarding) {
    return <div className="min-h-[100dvh] overflow-y-auto bg-background font-sans"><main className="w-full">{children}</main></div>;
  }

  if (user && location.pathname === '/start-project' && role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user && location.pathname === '/checkout' && role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user || isPublic) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-8 w-8 rounded-md" />
                <span className="font-bold text-xl">FINALYZED</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/specialists">Find a Specialist</Link>
                <Link to="/how-it-works">How It Works</Link>
                <Link to="/knowledge-base">Knowledge Base</Link>
              </nav>
              <div className="hidden md:flex gap-4">
                <Link to={user ? '/dashboard' : '/login'} className="btn-primary px-5 py-2">
                  {user ? 'Dashboard' : 'Log in / Start Project'}
                </Link>
              </div>
              <button className="md:hidden p-2" aria-label="Open menu" onClick={() => setMobileMenuOpen(v => !v)}>
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border p-4 space-y-2">
              <Link onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl" to="/specialists">Find a Specialist</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl" to="/how-it-works">How It Works</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl" to="/knowledge-base">Knowledge Base</Link>
              <Link onClick={() => setMobileMenuOpen(false)} className="block p-3 rounded-xl bg-primary text-primary-foreground text-center font-semibold" to={user ? '/dashboard' : '/login'}>
                {user ? 'Go to Dashboard' : 'Log in / Start Project'}
              </Link>
            </div>
          )}
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto">{children}</main>
        <footer className="border-t border-border py-10">
          <div className="max-w-7xl mx-auto px-4 text-sm text-muted-foreground">© {new Date().getFullYear()} Finalyzed. All rights reserved.</div>
        </footer>
      </div>
    );
  }

  const navItems = [{ name: 'Dashboard', path: '/dashboard', icon: HomeIcon, primary: false }];

  if (isAdmin) {
    navItems.push(
      { name: 'Manage', path: '/admin/control', icon: UserCheck, primary: false },
      { name: 'Templates', path: '/admin/templates', icon: Feather, primary: false },
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, primary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, primary: false },
    );
  } else if (role === 'student') {
    navItems.push(
      { name: 'Search', path: '/specialists', icon: Search, primary: false },
      { name: 'New', path: '/start-project', icon: Feather, primary: true },
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, primary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, primary: false },
    );
  } else {
    navItems.push(
      { name: 'Search', path: '/specialists', icon: Search, primary: false },
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, primary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, primary: false },
    );
    if (role === 'writer' || role === 'editor') {
      navItems.push({ name: 'Bank', path: '/bank-details', icon: WalletIcon, primary: false });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`hidden md:flex flex-col border-r border-border ${sidebarExpanded ? 'w-64' : 'w-20'} transition-all`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-7 w-7 rounded-md" />
            {sidebarExpanded && <span className="font-bold">FINALYZED</span>}
          </Link>
          <button aria-label="Toggle sidebar" onClick={() => setSidebarExpanded(v => !v)}>
            {sidebarExpanded ? <ChevronLeft className="w-4" /> : <ChevronRight className="w-4" />}
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(({ name, path, icon: Icon, primary }) => (
            <Link key={path} to={path} title={!sidebarExpanded ? name : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${location.pathname === path ? 'bg-primary text-primary-foreground' : primary ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <Icon className="w-4 h-4" />{sidebarExpanded && name}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
          <LogOut className="w-4 h-4" />{sidebarExpanded && 'Log out'}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <button className="md:hidden p-2" aria-label="Open dashboard menu" onClick={() => setMobileMenuOpen(true)}><Menu className="w-5" /></button>
          <span className="font-semibold text-sm">{isAdmin ? 'Admin' : userData?.name || 'Finalyzed'}</span>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user?.id || ''} />
            <button className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold" aria-label="Profile">
              {(userData?.name || 'U').charAt(0).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background p-4 overflow-y-auto">
          <div className="flex justify-between mb-5">
            <b>FINALYZED</b>
            <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X /></button>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ name, path, icon: Icon }) => (
              <Link key={path} onClick={() => setMobileMenuOpen(false)} to={path} className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold ${location.pathname === path ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                <Icon className="w-5" />{name}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-5 border-t border-border">
            <button onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-muted-foreground hover:bg-muted">
              <LogOut className="w-5 h-5" />Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  return userData?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function SpecialistOnly({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  return userData?.role === 'writer' || userData?.role === 'editor' ? <>{children}</> : <Navigate to="/wallet" replace />;
}

function WalletRoute() {
  const { userData } = useAuth();
  return userData?.role === 'admin' ? <AdminWallet /> : <Wallet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/become-specialist" element={<Layout><Onboarding /></Layout>} />
          <Route path="/oauth-callback" element={<Layout><OAuthCallback /></Layout>} />
          <Route path="/auth/callback" element={<Layout><OAuthCallback /></Layout>} />
          <Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />
          <Route path="/dashboard" element={<Layout><DashboardDispatcher /></Layout>} />
          <Route path="/specialists" element={<Layout><Marketplace /></Layout>} />
          <Route path="/specialists/:id" element={<Layout><SpecialistProfile /></Layout>} />
          <Route path="/specialist/:id" element={<Layout><SpecialistProfile /></Layout>} />
          <Route path="/start-project" element={<Layout><ProjectWizard /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectWorkspace /></Layout>} />
          {/* Backwards-compatible route used by the dashboard project cards. */}
          <Route path="/workspace/:id" element={<Layout><ProjectWorkspace /></Layout>} />
          <Route path="/projects/:id/qa" element={<Layout><QAWorkspace /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
          <Route path="/knowledge-base" element={<Layout><KnowledgeBase /></Layout>} />
          <Route path="/admin/templates" element={<AdminOnly><Layout><AdminTemplates /></Layout></AdminOnly>} />
          <Route path="/admin/control" element={<AdminOnly><Layout><AdminControlCenter /></Layout></AdminOnly>} />
          <Route path="/bank-details" element={<SpecialistOnly><Layout><BankDetails /></Layout></SpecialistOnly>} />
          <Route path="/wallet" element={<Layout><WalletRoute /></Layout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
