import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { hasSupabaseConfig } from './lib/supabase';
import { getSession, onAuthChange, fetchMemberships } from './services/authService';
import App from './App.jsx';
import AuthPage from './AuthPage.jsx';
import OnboardingPage from './OnboardingPage.jsx';
import LandingPage from './LandingPage.jsx';
import WaitlistPage from './WaitlistPage.jsx';
import AdminPage from './AdminPage.jsx';

const ADMIN_UID = '06d41f5f-07c6-4922-9456-3e935eef72e7';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate2" />
    </div>
  );
}

export default function Root() {
  const [session, setSession] = useState(undefined);
  const [memberships, setMemberships] = useState(undefined);
  const [membershipError, setMembershipError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [adminMode, setAdminMode] = useState(true);

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

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    getSession()
      .then(s => { if (active) setSession(s); })
      .catch(() => { if (active) setSession(null); });
    const unsub = onAuthChange(s => {
      setSession(s);
      setMemberships(undefined);
    });
    return () => { active = false; unsub(); };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    if (session && memberships === undefined) loadMemberships();
  }, [session, memberships, loadMemberships]);

  if (!hasSupabaseConfig) return <App />;

  if (session === undefined) return <FullScreenLoader />;

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!session) {
    if (showAuth) {
      return (
        <AuthPage
          onAuthed={setSession}
          onBack={() => setShowAuth(false)}
        />
      );
    }
    return <LandingPage onShowAuth={() => setShowAuth(true)} />;
  }

  // ── Signed in — loading memberships ────────────────────────────────────────
  if (memberships === undefined) return <FullScreenLoader />;

  const signOut = () => { setSession(null); setMemberships(undefined); setShowAuth(false); };

  // ── No org yet → onboarding ────────────────────────────────────────────────
  if (memberships.length === 0) {
    return (
      <OnboardingPage
        email={session.user?.email}
        onCreated={loadMemberships}
        onSignOut={signOut}
      />
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (session.user?.id === ADMIN_UID && adminMode) {
    return <AdminPage onSignOut={signOut} onOpenApp={() => setAdminMode(false)} />;
  }

  const activeOrg = memberships[0];

  // ── Org not approved → waitlist ────────────────────────────────────────────
  if (!activeOrg.approved) {
    return (
      <WaitlistPage
        email={session.user?.email}
        onSignOut={signOut}
      />
    );
  }

  // ── Approved → app ─────────────────────────────────────────────────────────
  return (
    <App
      session={session}
      organizationName={activeOrg?.name}
      membershipError={membershipError}
      onSignOut={signOut}
      isAdmin={session.user?.id === ADMIN_UID}
      onOpenAdmin={() => setAdminMode(true)}
    />
  );
}
