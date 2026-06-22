import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { hasSupabaseConfig } from './lib/supabase';
import { getSession, onAuthChange, fetchMemberships } from './services/authService';
import App from './App.jsx';
import AuthPage from './AuthPage.jsx';
import OnboardingPage from './OnboardingPage.jsx';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate2" />
    </div>
  );
}

export default function Root() {
  // session: undefined = still loading, null = signed out, object = signed in
  const [session, setSession] = useState(undefined);
  // memberships: undefined = not loaded yet, array = loaded
  const [memberships, setMemberships] = useState(undefined);
  const [membershipError, setMembershipError] = useState('');

  const loadMemberships = useCallback(async () => {
    setMembershipError('');
    try {
      const m = await fetchMemberships();
      setMemberships(m);
    } catch (e) {
      setMembershipError(e.message || 'Could not load your workspace.');
      setMemberships([]);
    }
  }, []);

  // Initial session + subscribe to auth changes
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    getSession()
      .then(s => { if (active) setSession(s); })
      .catch(() => { if (active) setSession(null); });
    const unsub = onAuthChange(s => {
      setSession(s);
      setMemberships(undefined); // re-check membership for the new session
    });
    return () => { active = false; unsub(); };
  }, []);

  // Load memberships whenever we have a session but haven't loaded them
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    if (session && memberships === undefined) loadMemberships();
  }, [session, memberships, loadMemberships]);

  // No backend configured → run the app in local (localStorage) mode, no auth.
  if (!hasSupabaseConfig) return <App />;

  if (session === undefined) return <FullScreenLoader />;

  if (!session) return <AuthPage onAuthed={setSession} />;

  if (memberships === undefined) return <FullScreenLoader />;

  if (memberships.length === 0) {
    return (
      <OnboardingPage
        email={session.user?.email}
        onCreated={loadMemberships}
        onSignOut={() => { setSession(null); setMemberships(undefined); }}
      />
    );
  }

  const activeOrg = memberships[0];

  return (
    <App
      session={session}
      organizationName={activeOrg?.name}
      membershipError={membershipError}
      onSignOut={() => { setSession(null); setMemberships(undefined); }}
    />
  );
}
