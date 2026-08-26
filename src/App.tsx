import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Feather, Menu, X, ArrowRight, CheckCircle, Shield, Briefcase, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import DashboardDispatcher from './pages/DashboardDispatcher';
import ProjectWizard from './pages/ProjectWizard';
import Marketplace from './pages/Marketplace';
import SpecialistProfile from './pages/SpecialistProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import ProjectWorkspace from './pages/ProjectWorkspace';
import QAWorkspace from './pages/QAWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import Wallet from './pages/Wallet';
import HowItWorks from './pages/HowItWorks';
import KnowledgeBase from './pages/KnowledgeBase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth } from './lib/firebase';

// Simple Layout component that provides the Navigation and Footer
function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <img src="/finalyzed_logo.png" alt="Finalyzed" className="h-9 w-9 rounded-md object-cover" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/specialists" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm">
                Find a Specialist
              </Link>
              <Link to="/how-it-works" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm">
                How It Works
              </Link>
              <Link to="/knowledge-base" className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm">
                Knowledge Base
              </Link>
              {!loading && user && (
                <Link to="/dashboard" className="text-primary hover:text-primary-light transition-colors font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {!loading && user ? (
                <>
                  <span className="text-xs text-muted-foreground font-mono">{user.displayName || user.email}</span>
                  <button onClick={handleLogout} className="text-foreground font-medium text-sm hover:text-primary transition-colors">
                    Log out
                  </button>
                  <Link to="/start-project" className="btn-primary px-4 py-2 text-sm">
                    Start Project
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-foreground font-medium text-sm hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link to="/login" className="btn-primary px-4 py-2 text-sm">
                    Start Project
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-foreground p-2 -mr-2 rounded-md hover:bg-muted focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-border bg-background"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                <Link to="/specialists" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">
                  Find a Specialist
                </Link>
                <Link to="/how-it-works" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">
                  How It Works
                </Link>
                <Link to="/knowledge-base" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">
                  Knowledge Base
                </Link>
                {!loading && user && (
                  <Link to="/dashboard" className="block px-3 py-3 rounded-md text-base font-bold text-primary hover:bg-muted">
                    Dashboard
                  </Link>
                )}
                <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3 px-3">
                  {!loading && user ? (
                    <>
                      <button onClick={handleLogout} className="btn-secondary w-full px-4 py-2 text-center text-sm">
                        Log out
                      </button>
                      <Link to="/start-project" className="btn-primary w-full px-4 py-2 text-center text-sm">
                        Start Project
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn-secondary w-full px-4 py-2 text-center text-sm">
                        Log in
                      </Link>
                      <Link to="/login" className="btn-primary w-full px-4 py-2 text-center text-sm">
                        Start Project
                      </Link>
                    </>
                  )}
                </div>
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
              <p className="text-gray-400 text-sm">
                Get it written. Get it done. The professional academic project-support marketplace.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/specialists" className="hover:text-primary transition-colors">Marketplace</Link></li>
                <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How it works</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/knowledge-base" className="hover:text-primary transition-colors">Knowledge Base</Link></li>
                <li><Link to="/become-specialist" className="hover:text-primary transition-colors">Become a Specialist</Link></li>
                <li><Link to="/become-editor" className="hover:text-primary transition-colors">Become an Editor</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 tracking-wider text-sm uppercase text-gray-300">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/academic-integrity" className="hover:text-primary transition-colors">Academic Integrity</Link></li>
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardDispatcher />} />
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
