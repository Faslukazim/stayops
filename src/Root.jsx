import { useEffect, useState, useCallback } from 'react';
import { Loader2, X, Download, Share } from 'lucide-react';
import { hasSupabaseConfig } from './lib/supabase';
import { getSession, onAuthChange, fetchMemberships } from './services/authService';
import App from './App.jsx';
import AuthPage from './AuthPage.jsx';
import OnboardingPage from './OnboardingPage.jsx';
import LandingPage from './LandingPage.jsx';
import WaitlistPage from './WaitlistPage.jsx';
import AdminPage from './AdminPage.jsx';

function InstallBanner() {
  const [state, setState] = useState(null); // 'android' | 'ios' | null
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [step, setStep] = useState('banner'); // 'banner' | 'ios-guide'

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone;

    if (isStandalone) return; // already installed

    if (isIOS) {
      setState('ios');
      return;
    }

    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState('android');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setState(null);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setState(null);
      else dismiss();
    }
  };

  if (!state) return null;

  if (state === 'ios' && step === 'ios-guide') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[80] bg-ink text-white rounded-2xl p-4 shadow-xl">
        <button onClick={dismiss} className="absolute top-3 right-3 text-white/60 hover:text-white"><X size={16} /></button>
        <p className="font-semibold mb-3 text-sm">Install NivaOps</p>
        <ol className="text-sm text-white/80 space-y-2">
          <li className="flex items-center gap-2">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            Tap the <Share size={14} className="inline mx-1" /> <strong>Share</strong> button in Safari
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            Scroll down and tap <strong>"Add to Home Screen"</strong>
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            Tap <strong>"Add"</strong> — done!
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[80] bg-ink text-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-leaf flex items-center justify-center shrink-0">
        <Download size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install NivaOps</p>
        <p className="text-xs text-white/70">Quick access from your home screen</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={state === 'android' ? install : () => setStep('ios-guide')}
          className="bg-leaf text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
        >
          Install
        </button>
        <button onClick={dismiss} className="text-white/60 hover:text-white"><X size={16} /></button>
      </div>
    </div>
  );
}

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

  // ── Admin (check before org — admin has no org membership) ────────────────
  if (session.user?.id === ADMIN_UID && adminMode) {
    return <AdminPage onSignOut={signOut} onOpenApp={() => setAdminMode(false)} />;
  }

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
    <>
      <App
        session={session}
        organizationName={activeOrg?.name}
        organizationId={activeOrg?.organizationId}
        plan={activeOrg?.plan ?? 'starter'}
        membershipError={membershipError}
        onSignOut={signOut}
        isAdmin={session.user?.id === ADMIN_UID}
        onOpenAdmin={() => setAdminMode(true)}
      />
      <InstallBanner />
    </>
  );
}
