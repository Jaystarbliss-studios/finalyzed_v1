import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, X, Home as HomeIcon, Search, Feather, Compass,
  Wallet as WalletIcon, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
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
import Wallet from './pages/Wallet';
import Login from './pages/Login';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Finalyzed...</div>;
  }

  const isAdmin = userData?.role === 'admin';
  const role = userData?.role;

  const isStrictlyPublic = ['/', '/login', '/how-it-works'].includes(location.pathname);
  const isOnboarding = location.pathname === '/onboarding';
  const isIncompleteRegistration = Boolean(user && !isAdmin && userData && !userData.onboardingComplete);

  if (isIncompleteRegistration && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isOnboarding) {
    return <div className="min-h-[100dvh] overflow-y-auto bg-background font-sans"><main className="w-full">{children}</main></div>;
  }

  const useAppLayout = user && !isStrictlyPublic;

  if (!useAppLayout) {
    // --- MARKETING LAYOUT (Logged out, or viewing homepage) ---
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-8 w-8 rounded-md object-cover" />
                  <span className="font-bold text-xl tracking-tight hidden sm:block">FINALYZED</span>
                </Link>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/specialists" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Find a Specialist</Link>
                <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</Link>
                <Link to="/knowledge-base" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Knowledge Base</Link>
              </nav>
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <Link to="/dashboard" className="btn-primary px-5 py-2 text-sm">Go to Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
                    <Link to="/login" className="btn-primary px-5 py-2 text-sm">Start Project</Link>
                  </>
                )}
              </div>
              <div className="md:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-foreground p-2">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-b border-border bg-background overflow-hidden"
              >
                <div className="px-4 pt-2 pb-6 space-y-1">
                  <Link to="/specialists" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Find a Specialist</Link>
                  <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">How It Works</Link>
                  <Link to="/knowledge-base" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Knowledge Base</Link>
                  {user ? (
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-bold text-primary hover:bg-muted">Dashboard</Link>
                  ) : (
                    <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3 px-3">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full px-4 py-2 text-center text-sm">Log in</Link>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full px-4 py-2 text-center text-sm">Start Project</Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>

        <footer className="bg-background text-foreground border-t border-border py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-9 w-9 rounded-md object-cover opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
                </Link>
                <p className="text-gray-400 text-sm">Get it written. Get it done. The professional academic project-support marketplace.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Platform</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/specialists" className="hover:text-primary transition-colors">Marketplace</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How it works</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Resources</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/knowledge-base" className="hover:text-primary transition-colors">Knowledge Base</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                  <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Finalyzed. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // --- APP SHELL LAYOUT (Logged in, internal routes) ---
  let navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, isPrimary: false },
  ];

  if (isAdmin) {
    navItems.push(
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, isPrimary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, isPrimary: false }
    );
  } else if (role === 'student') {
    navItems.push(
      { name: 'Search', path: '/specialists', icon: Search, isPrimary: false },
      { name: 'New', path: '/start-project', icon: Feather, isPrimary: true },
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, isPrimary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, isPrimary: false }
    );
  } else {
    // Specialist or Editor
    navItems.push(
      { name: 'Search', path: '/specialists', icon: Search, isPrimary: false },
      { name: 'Knowledge', path: '/knowledge-base', icon: Compass, isPrimary: false },
      { name: 'Wallet', path: '/wallet', icon: WalletIcon, isPrimary: false }
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans selection:bg-primary/20">
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-background transition-all duration-300 relative z-20 ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          {isSidebarExpanded ? (
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-7 w-7 rounded-md object-cover" />
              <span className="font-bold text-lg tracking-tight">FINALYZED</span>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto flex justify-center w-full">
              <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-7 w-7 rounded-md object-cover" />
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/' && item.path !== '/dashboard');
            // Strict match for dashboard so it doesn't stay highlighted when inside workspace
            const isStrictActive = location.pathname === item.path;
            const activeCheck = item.path === '/dashboard' ? isStrictActive : isActive;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  item.isPrimary
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-dark'
                    : activeCheck
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                } ${!isSidebarExpanded && 'justify-center'}`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${item.isPrimary ? 'text-primary-foreground' : (activeCheck ? 'text-primary' : '')}`} />
                {isSidebarExpanded && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full ${!isSidebarExpanded && 'justify-center'}`}
            title="Collapse Sidebar"
          >
            {isSidebarExpanded ? <ChevronLeft className="w-5 h-5 shrink-0" /> : <ChevronRight className="w-5 h-5 shrink-0" />}
            {isSidebarExpanded && <span className="text-sm font-medium">Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors w-full ${!isSidebarExpanded && 'justify-center'}`}
            title="Log out"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarExpanded && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-muted/20">
        
        {/* MOBILE TOP BAR */}
        <header className="md:hidden h-16 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-md z-40">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-8 w-8 rounded-md object-cover" />
            <span className="font-bold text-lg tracking-tight">FINALYZED</span>
          </Link>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-red-500 p-2 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* DESKTOP TOP BAR */}
        <header className="hidden md:flex h-16 border-b border-border items-center justify-between px-8 shrink-0 bg-background z-10 shadow-sm shadow-black/5">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               Welcome back, <span className="text-foreground capitalize">{userData?.name?.split(' ')[0] || user.email?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} />
              <div className="text-right">
                <p className="text-sm font-bold capitalize leading-tight">{userData?.name || user.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground capitalize leading-tight">{isAdmin ? 'Administrator' : userData?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                {(userData?.name || user.email || 'U').charAt(0)}
              </div>
            </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 px-2 py-2 flex justify-between items-center safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/' && item.path !== '/dashboard');
            const isStrictActive = location.pathname === item.path;
            const activeCheck = item.path === '/dashboard' ? isStrictActive : isActive;
            
            if (item.isPrimary) {
              return (
                <Link key={item.path} to={item.path} className="flex flex-col items-center p-2 text-primary -mt-6">
                  <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/30 border-4 border-background">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-medium mt-1">{item.name}</span>
                </Link>
              );
            }
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${activeCheck ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <item.icon className={`w-5 h-5 mb-1 ${activeCheck ? 'fill-primary/10' : ''}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardDispatcher />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/start-project" element={<ProjectWizard />} />
            <Route path="/specialists" element={<Marketplace />} />
            <Route path="/specialist/:id" element={<SpecialistProfile />} />
            <Route path="/workspace/:id" element={<ProjectWorkspace />} />
            <Route path="/qa-workspace/:id" element={<QAWorkspace />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<div className="p-8 text-center mt-20"><h2 className="text-2xl font-bold">Coming Soon</h2></div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
