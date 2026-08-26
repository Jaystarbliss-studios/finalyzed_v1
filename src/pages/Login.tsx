import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const profile = await getDoc(doc(db, 'users', credential.user.uid));

      // Firebase authentication alone is not a completed Finalyzed registration.
      // First-time users must explicitly choose how they will use the platform.
      navigate(profile.exists() ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err: any) {
      console.error('Google authentication failed:', err);
      setError(err?.code === 'auth/popup-closed-by-user'
        ? 'The Google sign-in window was closed. Please try again.'
        : err?.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase mb-3">Secure access</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
          Welcome to <span className="font-bold">FINALYZED</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
          Sign in securely with Google. New to Finalyzed? We’ll guide you through the right registration path.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bento-card p-6 md:p-8">
        {error && (
          <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-5">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-gray-900 border border-gray-300 py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-gray-900/25 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" />
              <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z" />
              <path fill="#FBBC05" d="M6.54 13.61A5.85 5.85 0 0 1 6.23 12c0-.56.11-1.1.31-1.61V7.87H3.3A9.5 9.5 0 0 0 2.5 12c0 1.49.36 2.9.8 4.13l3.24-2.52Z" />
              <path fill="#EA4335" d="M12 6.36c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.45 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.37l3.24 2.52C7.31 8.08 9.46 6.36 12 6.36Z" />
            </svg>
          )}
          {loading ? 'Signing you in…' : 'Continue with Google'}
          {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
        </button>

        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/10 p-4">
          <p className="text-sm font-semibold">First time here?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            After Google authentication, Finalyzed will ask whether you’re joining as a Student, Project Writer, or Editor and collect the information required for that role.
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          By continuing, you agree to use Finalyzed responsibly and in accordance with its academic-integrity and platform policies.
        </p>
      </motion.div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/" className="hover:text-primary transition-colors">Back to Finalyzed</Link>
      </p>
    </div>
  );
}
