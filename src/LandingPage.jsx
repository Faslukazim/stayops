import { useState } from 'react';
import { signIn } from './services/authService';
import { NivaLogo, NivaWordmark } from './components/NivaLogo';
import { ArrowRight, Check, Loader2, Menu, X } from 'lucide-react';

const C = {
  midnight: '#111827',
  charcoal: '#0F172A',
  green: '#16A34A',
  greenHover: '#15803D',
  greenLight: '#DCFCE7',
  slate: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  light: '#F8FAFC',
  surface: '#F1F5F9',
};

// ── Mockups ────────────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: 260, height: 530, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 46,
        background: '#0d1117',
        boxShadow: '0 80px 160px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <div style={{ position: 'absolute', inset: 3, borderRadius: 44, overflow: 'hidden', background: C.light, display: 'flex', flexDirection: 'column' }}>
          {/* status */}
          <div style={{ height: 40, background: C.midnight, display: 'flex', alignItems: 'flex-end', padding: '0 18px 7px', flexShrink: 0 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}>9:41</span>
            <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 64, height: 20, background: '#0d1117', borderRadius: 12 }} />
            <div style={{ marginLeft: 'auto', width: 12, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
          </div>
          {/* header */}
          <div style={{ background: C.midnight, padding: '10px 18px 18px', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Dashboard</p>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 2, letterSpacing: '-0.02em' }}>Good morning</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 12 }}>
              {[
                { v: '14', l: 'Rooms', bg: 'rgba(255,255,255,0.08)', vc: '#fff', lc: 'rgba(255,255,255,0.4)' },
                { v: '₹1.2L', l: 'Collected', bg: 'rgba(22,163,74,0.2)', vc: '#86efac', lc: 'rgba(134,239,172,0.55)' },
                { v: '3', l: 'Overdue', bg: 'rgba(239,68,68,0.15)', vc: '#fca5a5', lc: 'rgba(252,165,165,0.55)' },
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, borderRadius: 11, padding: '8px 9px' }}>
                  <p style={{ color: s.vc, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{s.v}</p>
                  <p style={{ color: s.lc, fontSize: 9, marginTop: 4 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* list */}
          <div style={{ flex: 1, padding: '14px 14px 0', overflow: 'hidden' }}>
            <p style={{ fontSize: 9.5, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Due This Week</p>
            {[
              { n: 'Rahul Kumar', r: 'Room 3 · Bed A', s: 'overdue' },
              { n: 'Priya Singh', r: 'Room 5 · Bed B', s: 'paid' },
              { n: 'Arjun Mehta', r: 'Room 7 · Bed C', s: 'pending' },
              { n: 'Meena Iyer', r: 'Room 2 · Bed A', s: 'paid' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: C.green, fontSize: 9, fontWeight: 700 }}>{t.n[0]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.charcoal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.n}</p>
                  <p style={{ fontSize: 8.5, color: C.muted }}>{t.r}</p>
                </div>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '2.5px 7px', borderRadius: 99,
                  background: t.s === 'paid' ? C.greenLight : t.s === 'overdue' ? '#FEF2F2' : '#FFFBEB',
                  color: t.s === 'paid' ? C.green : t.s === 'overdue' ? '#EF4444' : '#D97706',
                }}>{t.s}</span>
              </div>
            ))}
          </div>
          {/* bottom nav */}
          <div style={{ height: 48, background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px', flexShrink: 0 }}>
            {[true, false, false, false].map((active, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.green : 'rgba(255,255,255,0.22)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={[
                  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
                  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                ][i]} />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserMockup() {
  const rooms = [
    { n: 'Room 1', beds: [true, true, false], occ: 2 },
    { n: 'Room 2', beds: [true, false, false], occ: 1 },
    { n: 'Room 3', beds: [true, true, true], occ: 3 },
    { n: 'Room 4', beds: [false, true, false], occ: 1 },
    { n: 'Room 5', beds: [true, true, false], occ: 2 },
    { n: 'Room 6', beds: [false, false, true], occ: 1 },
  ];
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.13)', background: '#fff' }}>
      {/* chrome */}
      <div style={{ background: C.midnight, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>app.nivaops.com · Rooms</span>
        </div>
      </div>
      {/* layout */}
      <div style={{ display: 'flex' }}>
        {/* sidebar */}
        <div style={{ width: 52, background: C.midnight, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 16 }}>
          {[true, false, false, false].map((a, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: a ? 'rgba(22,163,74,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a ? C.green : 'rgba(255,255,255,0.2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={[
                  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
                  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                ][i]} />
              </svg>
            </div>
          ))}
        </div>
        {/* main */}
        <div style={{ flex: 1, padding: 16, background: C.light }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>Rooms</p>
              <p style={{ fontSize: 10, color: C.muted }}>Sunrise PG · 18 beds</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ l: '10 Occupied', bg: C.greenLight, c: C.green }, { l: '8 Vacant', bg: C.surface, c: C.slate }].map(b => (
                <span key={b.l} style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: b.bg, color: b.c }}>{b.l}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {rooms.map((r, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 10px 8px', border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: C.charcoal, marginBottom: 2 }}>{r.n}</p>
                <p style={{ fontSize: 8, color: C.muted, marginBottom: 8 }}>{r.occ}/{r.beds.length} beds</p>
                <div style={{ display: 'flex', gap: 3 }}>
                  {r.beds.map((occ, j) => (
                    <div key={j} style={{ width: 14, height: 14, borderRadius: 3, background: occ ? C.green : C.surface, border: `1px solid ${occ ? C.green : C.border}` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* tenant strip */}
          <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[
              { n: 'Rahul Kumar', r: 'Room 3 · A', s: 'overdue', a: '₹8,500' },
              { n: 'Priya Singh', r: 'Room 5 · B', s: 'paid', a: '₹7,200' },
              { n: 'Arjun Mehta', r: 'Room 1 · C', s: 'pending', a: '₹9,000' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: C.green }}>{t.n[0]}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: C.charcoal, flex: 1 }}>{t.n}</p>
                <p style={{ fontSize: 9, color: C.muted }}>{t.r}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: C.charcoal }}>{t.a}</p>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: t.s === 'paid' ? C.greenLight : t.s === 'overdue' ? '#FEF2F2' : '#FFFBEB',
                  color: t.s === 'paid' ? C.green : t.s === 'overdue' ? '#EF4444' : '#D97706' }}>
                  {t.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage({ onShowAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  async function tryDemo() {
    setDemoLoading(true);
    setDemoError('');
    try {
      await signIn('demo@stayops.com', 'demo2026');
    } catch {
      setDemoError('Demo unavailable. Try again in a moment.');
      setDemoLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.055)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <NivaLogo size={22} />
            <NivaWordmark size="base" />
          </div>
          <div className="hidden sm:flex" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onShowAuth} style={{ fontSize: 13, color: C.slate, fontWeight: 500, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Sign in
            </button>
            <button onClick={tryDemo} disabled={demoLoading} style={{ fontSize: 13, color: '#fff', fontWeight: 700, padding: '7px 16px', borderRadius: 8, background: C.midnight, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.charcoal}
              onMouseLeave={e => e.currentTarget.style.background = C.midnight}>
              {demoLoading ? <Loader2 size={12} className="animate-spin" /> : null}
              Try demo <ArrowRight size={12} />
            </button>
          </div>
          <button className="sm:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.slate }}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.055)', padding: '12px 20px 16px' }} className="sm:hidden">
            <button onClick={onShowAuth} style={{ width: '100%', padding: '10px', marginBottom: 8, borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 600, color: C.charcoal, cursor: 'pointer' }}>Sign in</button>
            <button onClick={tryDemo} disabled={demoLoading} style={{ width: '100%', padding: '10px', borderRadius: 10, background: C.midnight, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {demoLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Try demo <ArrowRight size={13} />
            </button>
          </div>
        )}
      </nav>

      {/* 1. HERO */}
      <section style={{ background: C.midnight, paddingTop: 100, paddingBottom: 0, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          {/* copy */}
          <div style={{ textAlign: 'center', paddingBottom: 56 }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(42px, 6vw, 76px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.04em', marginBottom: 22 }}>
              The operating system<br />
              <span style={{ color: C.green }}>for your property.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.65, marginBottom: 38, maxWidth: 480, margin: '0 auto 38px' }}>
              Rooms, tenants, rent, and finances — one focused workspace for PG and hostel operators.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={tryDemo} disabled={demoLoading}
                style={{ background: C.green, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
                onMouseLeave={e => e.currentTarget.style.background = C.green}>
                {demoLoading && <Loader2 size={13} className="animate-spin" />}
                Try live demo <ArrowRight size={13} />
              </button>
              <button onClick={onShowAuth}
                style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, padding: '12px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                Sign in
              </button>
            </div>
            {demoError && <p style={{ color: '#f87171', fontSize: 13, marginTop: 16 }}>{demoError}</p>}
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, marginTop: 22 }}>No account needed · 5 minute setup</p>
          </div>

          {/* hero product — phone centered, browser mockup below bleeding */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, alignItems: 'flex-end', position: 'relative' }}>
            {/* glow */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: `radial-gradient(ellipse at center top, ${C.green}1a 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* 2. PRODUCT SHOWCASE */}
      <section style={{ padding: '96px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>The Product</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14 }}>
              Built for how you<br />actually run your property.
            </h2>
            <p style={{ fontSize: 15, color: C.slate, maxWidth: 380, margin: '0 auto' }}>
              See every bed, track every payment, and understand your finances — without opening a spreadsheet.
            </p>
          </div>
          <BrowserMockup />
        </div>
      </section>

      {/* 3. CORE WORKFLOWS */}
      <section style={{ background: C.surface, padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
              Four things. Done right.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              {
                icon: '🏠',
                title: 'Rooms',
                desc: 'Every floor, room, and bed — visualized. Know occupancy at a glance.',
                detail: 'Assign, vacate, and reassign beds in seconds.',
              },
              {
                icon: '₹',
                title: 'Payments',
                desc: 'See who\'s paid and who\'s overdue. Mark rent collected with one tap.',
                detail: 'Deposits, admission fees, and monthly rent — all tracked.',
              },
              {
                icon: '📊',
                title: 'Finance',
                desc: 'Monthly P&L auto-calculated. Expenses categorized. Cash flow clear.',
                detail: 'No formulas. No manual work.',
              },
              {
                icon: '💬',
                title: 'Reminders',
                desc: 'WhatsApp message pre-filled with name, room, amount, and UPI link.',
                detail: 'One tap to send. Done.',
              },
            ].map((w, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{w.icon}</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 8, letterSpacing: '-0.01em' }}>{w.title}</p>
                <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, marginBottom: 10 }}>{w.desc}</p>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{w.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section style={{ padding: '88px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', marginBottom: 10 }}>Simple pricing.</h2>
            <p style={{ fontSize: 15, color: C.slate }}>No lock-in. Cancel anytime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="sm:grid-cols-2 grid-cols-1">
            {/* Starter */}
            <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>Starter</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: C.charcoal, letterSpacing: '-0.04em', lineHeight: 1 }}>₹799</span>
                <span style={{ fontSize: 13, color: C.muted, paddingBottom: 6 }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 28 }}>Up to 25 beds · 1 property</p>
              <ul style={{ flex: 1, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Tenant management', 'Rent tracking', 'Expense logging', 'Finance reports', 'Mobile PWA'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Check size={13} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.charcoal }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 600, color: C.charcoal, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Get started
              </button>
            </div>
            {/* Growth */}
            <div style={{ background: C.midnight, borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: C.green, color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '5px 14px', borderRadius: '0 18px 0 12px', letterSpacing: '0.06em' }}>POPULAR</div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>Growth</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>₹1,499</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', paddingBottom: 6 }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 28 }}>Up to 100 beds · Multiple properties</p>
              <ul style={{ flex: 1, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Everything in Starter', 'Multiple properties', 'Advanced reports', 'Admin panel', 'Priority support'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Check size={13} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: f === 'Everything in Starter' ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.82)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth} style={{ width: '100%', padding: '11px', borderRadius: 10, background: C.green, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
                onMouseLeave={e => e.currentTarget.style.background = C.green}>
                Get started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section style={{ background: C.midnight, padding: '88px 20px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 18 }}>
            Your property,<br />
            <span style={{ color: C.green }}>finally organised.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.65, marginBottom: 36 }}>
            No spreadsheets. No paper registers. No missed payments.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={tryDemo} disabled={demoLoading}
              style={{ background: C.green, color: '#fff', fontWeight: 700, fontSize: 14, padding: '13px 26px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
              onMouseLeave={e => e.currentTarget.style.background = C.green}>
              {demoLoading && <Loader2 size={13} className="animate-spin" />}
              Try live demo <ArrowRight size={13} />
            </button>
            <button onClick={onShowAuth}
              style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: 14, padding: '13px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}>
              Create account
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.charcoal, padding: '28px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NivaLogo size={18} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>NivaOps</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Pricing', 'Sign in', 'Try demo'].map((l, i) => (
              <button key={l} onClick={i === 2 ? tryDemo : onShowAuth}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                {l}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>© 2025 NivaOps · Property management, simplified.</p>
        </div>
      </footer>

    </div>
  );
}
