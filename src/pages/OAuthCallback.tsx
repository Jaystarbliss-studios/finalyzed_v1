import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        const oauthError = new URLSearchParams(window.location.search).get('error_description');
        if (oauthError) throw new Error(oauthError);
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Google authentication completed, but no session was established. Please try again.');
        if (active) navigate('/dashboard', { replace: true });
      } catch (e: any) {
        console.error('Finalyzed OAuth callback failed:', e);
        if (active) setError(e?.message || 'Unable to complete Google sign-in. Please try again.');
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
    <div className="w-full max-w-md bento-card p-8 text-center">
      {error ? <><h1 className="text-xl font-bold text-foreground">Sign-in could not be completed</h1><p className="text-sm text-muted-foreground mt-3">{error}</p><button onClick={() => navigate('/login', { replace: true })} className="btn-primary mt-6 px-5 py-3 rounded-xl">Return to login</button></> : <><div className="mx-auto w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" /><h1 className="text-xl font-bold mt-5">Completing secure sign-in…</h1><p className="text-sm text-muted-foreground mt-2">Please wait while Finalyzed establishes your session.</p></>}
    </div>
  </div>;
}
