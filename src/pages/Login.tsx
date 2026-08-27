import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      // OAuth is intentionally completed before role routing. A first-time Google
      // account has no Finalyzed profile yet and must complete onboarding.
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('Google authentication failed:', err);
      setError(err?.message || 'Unable to sign in with Google. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5"><ShieldCheck className="w-8 h-8 text-primary" /></div>
        <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase mb-3">Secure access</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">Welcome to <span className="font-bold">FINALYZED</span></h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">Sign in securely with Google. New accounts choose Student, Project Writer, or Editor after authentication. Administrators bypass onboarding completely.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bento-card p-6 md:p-8">
        {error && <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-5">{error}</div>}
        <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white text-gray-900 border border-gray-300 py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
          {loading ? <span className="w-5 h-5 border-2 border-gray-900/25 border-t-gray-900 rounded-full animate-spin" /> : <span className="font-bold text-lg">G</span>}
          {loading ? 'Redirecting to Google…' : 'Continue with Google'} {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
        </button>
        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/10 p-4"><p className="text-sm font-semibold">First time here?</p><p className="text-xs text-muted-foreground mt-1 leading-relaxed">After Google authentication, Finalyzed will ask whether you’re joining as a Student, Project Writer, or Editor and collect the information required for that role.</p></div>
        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">By continuing, you agree to use Finalyzed responsibly and in accordance with its academic-integrity and platform policies.</p>
      </motion.div>
      <p className="text-center text-sm text-muted-foreground mt-6"><Link to="/" className="hover:text-primary transition-colors">Back to Finalyzed</Link></p>
    </div>
  );
}
