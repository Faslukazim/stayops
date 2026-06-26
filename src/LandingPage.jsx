import { useState } from 'react';
import { signIn } from './services/authService';
import { NivaLogo, NivaWordmark } from './components/NivaLogo';
import { ArrowRight, Check, ChevronDown, Loader2, Menu, X } from 'lucide-react';

// ── Palette (inline styles use direct hex to avoid Tailwind purge) ─────────────
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

// ── App Mockups ────────────────────────────────────────────────────────────────

function PhoneMockup({ className = '' }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 240, height: 490 }}>
      {/* shell */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 42,
        background: '#0d1117', boxShadow: '0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* screen */}
        <div style={{
          position: 'absolute', inset: 3, borderRadius: 40,
          overflow: 'hidden', background: C.light, display: 'flex', flexDirection: 'column',
        }}>
          {/* status bar */}
          <div style={{ height: 38, background: C.midnight, display: 'flex', alignItems: 'flex-end', padding: '0 16px 6px', flexShrink: 0 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 500 }}>9:41</span>
            <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 60, height: 18, background: '#0d1117', borderRadius: 10 }} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center' }}>
              <div style={{ width: 11, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
          {/* dashboard header */}
          <div style={{ background: C.midnight, padding: '10px 16px 16px', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Dashboard</p>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 2, letterSpacing: '-0.02em' }}>Good morning</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
              {[
                { v: '14', l: 'Rooms', bg: 'rgba(255,255,255,0.08)', tc: '#fff', sc: 'rgba(255,255,255,0.4)' },
                { v: '₹1.2L', l: 'Collected', bg: 'rgba(22,163,74,0.2)', tc: '#86efac', sc: 'rgba(134,239,172,0.6)' },
                { v: '3', l: 'Overdue', bg: 'rgba(239,68,68,0.15)', tc: '#fca5a5', sc: 'rgba(252,165,165,0.6)' },
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, borderRadius: 10, padding: '7px 8px' }}>
                  <p style={{ color: s.tc, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{s.v}</p>
                  <p style={{ color: s.sc, fontSize: 8, marginTop: 3 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* tenant list */}
          <div style={{ flex: 1, padding: '12px 12px 0', overflow: 'hidden' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Due This Week</p>
            {[
              { n: 'Rahul Kumar', r: 'Room 3 · Bed A', s: 'overdue', a: '₹8,500' },
              { n: 'Priya Singh', r: 'Room 5 · Bed B', s: 'paid', a: '₹7,200' },
              { n: 'Arjun Mehta', r: 'Room 7 · Bed C', s: 'pending', a: '₹9,000' },
              { n: 'Meena Iyer', r: 'Room 2 · Bed A', s: 'paid', a: '₹6,800' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: C.green, fontSize: 8, fontWeight: 700 }}>{t.n[0]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: C.charcoal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.n}</p>
                  <p style={{ fontSize: 7.5, color: C.muted }}>{t.r}</p>
                </div>
                <span style={{
                  fontSize: 7, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                  background: t.s === 'paid' ? C.greenLight : t.s === 'overdue' ? '#FEF2F2' : '#FFFBEB',
                  color: t.s === 'paid' ? C.green : t.s === 'overdue' ? '#EF4444' : '#D97706',
                }}>{t.s}</span>
              </div>
            ))}
          </div>
          {/* bottom nav */}
          <div style={{ height: 44, background: C.midnight, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px', flexShrink: 0 }}>
            {[
              { svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
              { svg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', active: false },
              { svg: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', active: false },
              { svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: false },
            ].map((n, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={n.active ? C.green : 'rgba(255,255,255,0.25)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.svg} />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomsMockup({ className = '' }) {
  const rooms = [
    { n: 'Room 1', beds: [true, true, false], floor: 'Ground' },
    { n: 'Room 2', beds: [true, false, false], floor: 'Ground' },
    { n: 'Room 3', beds: [true, true, true], floor: 'First' },
    { n: 'Room 4', beds: [true, false, true], floor: 'First' },
    { n: 'Room 5', beds: [true, true, false], floor: 'Second' },
    { n: 'Room 6', beds: [false, false, true], floor: 'Second' },
  ];
  return (
    <div className={className} style={{ background: C.light, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
      {/* toolbar */}
      <div style={{ background: C.midnight, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 20, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>NivaOps · Rooms</span>
        </div>
      </div>
      {/* header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>Rooms</p>
          <p style={{ fontSize: 10, color: C.muted }}>Sunrise PG · 6 rooms · 18 beds</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['12 Occupied','6 Vacant'].map((l, i) => (
            <span key={l} style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: i === 0 ? C.greenLight : C.surface, color: i === 0 ? C.green : C.slate }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      {/* room grid */}
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {rooms.map((r, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 10px 8px', border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.charcoal }}>{r.n}</p>
            <p style={{ fontSize: 8, color: C.muted, marginBottom: 8 }}>{r.floor}</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {r.beds.map((occ, j) => (
                <div key={j} style={{ width: 18, height: 18, borderRadius: 4, background: occ ? C.green : C.surface, border: `1px solid ${occ ? C.green : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {occ && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceMockup({ className = '' }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const vals = [68, 74, 71, 82, 88, 95];
  const maxV = 100;
  return (
    <div className={className} style={{ background: C.light, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
      <div style={{ background: C.midnight, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 20, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>NivaOps · Finance · P&L</span>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Revenue', v: '₹1,24,500', d: '+12%', pos: true },
            { l: 'Expenses', v: '₹38,200', d: '-3%', pos: false },
            { l: 'Net', v: '₹86,300', d: '+18%', pos: true },
          ].map(k => (
            <div key={k.l} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{k.l}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{k.v}</p>
              <p style={{ fontSize: 9, color: k.pos ? C.green : '#EF4444', marginTop: 2, fontWeight: 600 }}>{k.d}</p>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>Rent Collection</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {months.map((m, i) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: i === months.length - 1 ? C.green : C.greenLight, borderRadius: '4px 4px 0 0', height: `${(vals[i] / maxV) * 64}px`, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 7, color: C.muted }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="font-semibold text-charcoal">{q}</span>
        <ChevronDown size={16} className={`text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-slate text-sm pb-5 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

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
      setDemoError('Demo unavailable right now. Try again in a moment.');
      setDemoLoading(false);
    }
  }

  const faqs = [
    { q: 'Can I manage multiple properties?', a: 'Yes. NivaOps supports multiple properties under one account. Switch between them instantly from the app. Each property has its own rooms, tenants, and financials.' },
    { q: 'Does NivaOps work on mobile?', a: 'NivaOps is built mobile-first as a Progressive Web App (PWA). Install it on any Android or iOS device from the browser — it works like a native app, even offline for core views.' },
    { q: 'Do my tenants need to download anything?', a: 'No. Tenants never interact with the app. NivaOps is entirely for the operator. You manage everything, and tenants receive WhatsApp messages or calls as you normally would.' },
    { q: 'How long does setup take?', a: 'Most operators are fully set up within 30 minutes. Add your property, create rooms and beds, add your tenants, and you\'re live. No training required.' },
    { q: 'Can I track deposits and admission fees?', a: 'Yes. Every tenant record tracks deposit amount, deposit status (held, returned, partial), and admission fees. You get a full financial picture per tenant.' },
    { q: 'Is my data secure?', a: 'All data is stored on Supabase (PostgreSQL), secured with row-level security so your data is completely isolated from other operators. Backups run daily.' },
  ];

  const workflows = [
    {
      time: 'Morning',
      step: 'Check occupancy',
      desc: 'See every room and bed at a glance. Know instantly who\'s in, who\'s out, and which beds are available.',
      color: '#DBEAFE',
      accent: '#3B82F6',
    },
    {
      time: 'New Admission',
      step: 'Assign a bed',
      desc: 'Add a new tenant in under two minutes. Capture name, phone, ID photo, rent amount, and deposit — all in one flow.',
      color: C.greenLight,
      accent: C.green,
    },
    {
      time: 'Rent Day',
      step: 'Collect & track',
      desc: 'See who\'s paid, who\'s due, and who\'s overdue. Mark payments with one tap. Totals update instantly.',
      color: '#FEF3C7',
      accent: '#D97706',
    },
    {
      time: 'Follow-up',
      step: 'Send a reminder',
      desc: 'WhatsApp reminder with the exact amount, room number, and your UPI link. Pre-filled. One tap to send.',
      color: '#F3E8FF',
      accent: '#9333EA',
    },
    {
      time: 'End of Month',
      step: 'Review revenue',
      desc: 'Monthly P&L, expense breakdown, cash flow — all automatically calculated from your rent and expense entries.',
      color: '#FFE4E6',
      accent: '#E11D48',
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NivaLogo size={24} />
            <NivaWordmark size="base" />
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={onShowAuth} className="text-sm text-slate hover:text-charcoal font-medium px-4 py-2 rounded-lg hover:bg-surface transition-colors">
              Sign in
            </button>
            <button onClick={tryDemo} disabled={demoLoading}
              className="flex items-center gap-1.5 bg-midnight hover:bg-charcoal active:scale-[0.98] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-60">
              {demoLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Try demo <ArrowRight size={13} />
            </button>
          </div>
          <button className="sm:hidden p-2 text-slate" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-black/[0.06] bg-white/95 backdrop-blur-xl px-5 pb-5 pt-3 space-y-2">
            <button onClick={onShowAuth} className="w-full text-center text-charcoal font-medium py-2.5 rounded-xl border border-border text-sm hover:bg-surface transition-colors">Sign in</button>
            <button onClick={tryDemo} disabled={demoLoading} className="w-full flex items-center justify-center gap-1.5 text-center bg-midnight text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
              {demoLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Try demo <ArrowRight size={13} />
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.midnight, paddingTop: 96, paddingBottom: 80 }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 mb-8">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em' }}>
                  Property Management · Reimagined
                </span>
              </div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 20 }}>
                The operating system<br />
                <span style={{ color: C.green }}>for your property.</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
                Every room, tenant, payment, and expense — one calm, focused workspace.
                Built for PG homes and hostels that run like a real business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={tryDemo} disabled={demoLoading}
                  style={{ background: C.green, color: '#fff', fontWeight: 700, fontSize: 14, padding: '13px 24px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
                  onMouseLeave={e => e.currentTarget.style.background = C.green}
                >
                  {demoLoading && <Loader2 size={14} className="animate-spin" />}
                  Try live demo <ArrowRight size={14} />
                </button>
                <button onClick={onShowAuth}
                  style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, padding: '13px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  Sign in to your account
                </button>
              </div>
              {demoError && <p className="text-red-400 text-sm mt-4">{demoError}</p>}
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20 }}>No account needed · No credit card · 5 minute setup</p>
            </div>

            {/* Right: phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow */}
                <div style={{ position: 'absolute', inset: -40, background: `radial-gradient(ellipse at center, ${C.green}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-5 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              'Built from real PG operations',
              'Manages 100+ beds daily',
              'Designed for how operators actually work',
              'No spreadsheets. No paper.',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check size={13} style={{ color: C.green }} />
                <span style={{ fontSize: 13, color: C.slate, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A DAY IN YOUR PROPERTY ──────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p style={{ color: C.green, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How operators use NivaOps</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', lineHeight: 1.1 }}>A day in your property.</h2>
            <p style={{ color: C.slate, fontSize: 16, marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
              NivaOps fits naturally into how you already work — just without the chaos.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-[88px] top-6 bottom-6 w-px bg-border" />

            <div className="space-y-6">
              {workflows.map((w, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  {/* Time label + dot */}
                  <div className="hidden md:flex flex-col items-end shrink-0" style={{ width: 80 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textAlign: 'right', lineHeight: 1 }}>{w.time}</span>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: w.accent, marginTop: 8, marginRight: -5, border: '2px solid white', boxShadow: `0 0 0 2px ${w.color}` }} />
                  </div>
                  {/* Card */}
                  <div className="flex-1 flex flex-col sm:flex-row gap-5 items-start sm:items-center bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>
                        {['☀️', '🏠', '💳', '📱', '📊'][i]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>{w.step}</p>
                      <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.6 }}>{w.desc}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: w.color, color: w.accent, whiteSpace: 'nowrap' }}>
                      {w.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROOMS SHOWCASE ──────────────────────────────────────────────────── */}
      <section style={{ background: C.midnight, padding: '80px 20px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p style={{ color: C.green, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Room & Bed Management</p>
              <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
                See your entire property<br />at a glance.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 380 }}>
                Every floor, every room, every bed — visualized. Know occupancy instantly. No spreadsheet. No whiteboard.
              </p>
              <ul className="space-y-3">
                {[
                  'Real-time occupancy per bed',
                  'Floor-by-floor navigation',
                  'One-tap tenant assignment',
                  'Vacant bed highlights',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} style={{ color: C.green }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <RoomsMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINANCE SHOWCASE ────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <FinanceMockup />
            </div>
            <div className="order-1 lg:order-2">
              <p style={{ color: C.green, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Finance & Revenue</p>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
                Know exactly where<br />your money stands.
              </h2>
              <p style={{ color: C.slate, fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 380 }}>
                Revenue, expenses, deposits, and P&L — automatically calculated every month. No formulas. No manual work.
              </p>
              <ul className="space-y-3">
                {[
                  'Monthly P&L auto-calculated',
                  'Expense tracking by category',
                  'Deposit ledger per tenant',
                  'Cash flow overview',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} style={{ color: C.green }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.slate }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ────────────────────────────────────────────────────── */}
      <section style={{ background: C.surface, padding: '80px 20px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em' }}>Everything you need to operate.</h2>
            <p style={{ color: C.slate, fontSize: 15, marginTop: 10 }}>Organized around real workflows, not feature lists.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                cat: 'Operations',
                icon: '🏠',
                items: ['Room & bed management', 'Occupancy tracking', 'Tenant onboarding', 'ID photo capture', 'Vacate & re-assign'],
              },
              {
                cat: 'Finance',
                icon: '₹',
                items: ['Rent collection', 'Overdue tracking', 'Deposit management', 'Expense logging', 'Monthly P&L'],
              },
              {
                cat: 'Communication',
                icon: '💬',
                items: ['WhatsApp reminders', 'Pre-filled rent messages', 'UPI link in message', 'One-tap follow-up', 'Per-tenant history'],
              },
              {
                cat: 'Tenant Records',
                icon: '📋',
                items: ['Full tenant profile', 'Join & exit date', 'Payment history', 'ID document storage', 'Admission fee tracking'],
              },
              {
                cat: 'Intelligence',
                icon: '📊',
                items: ['Occupancy rate', 'Revenue trends', 'Vacancy alerts', 'Expense breakdown', 'Cash flow view'],
              },
              {
                cat: 'Anywhere Access',
                icon: '📱',
                items: ['Mobile PWA — install like an app', 'Works on Android & iOS', 'Fast on slow connections', 'No app store needed', 'Multi-property support'],
              },
            ].map((g, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '22px 22px 24px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>{g.icon}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{g.cat}</p>
                </div>
                <ul className="space-y-2">
                  {g.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.slate }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NIVAOPS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Why operators switch<br />to NivaOps.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { before: 'Spreadsheets that break and go out of date.', after: 'Live data. Always current. Always accurate.' },
              { before: 'Paper registers you can\'t search or share.', after: 'Every tenant record in your pocket, searchable.' },
              { before: 'Chasing rent manually via calls and messages.', after: 'One tap sends a WhatsApp reminder with UPI link.' },
              { before: 'Guessing occupancy from memory.', after: 'Bed-level occupancy map, updated in real time.' },
              { before: 'Forgotten deposits causing disputes.', after: 'Deposit ledger per tenant. No disputes.' },
              { before: 'No idea if the property is profitable.', after: 'Monthly P&L, automatically.' },
            ].map((r, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#FEF2F2', borderBottom: `1px solid ${C.border}` }}>
                  <div className="flex items-start gap-2.5">
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>❌</span>
                    <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>{r.before}</p>
                  </div>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  <div className="flex items-start gap-2.5">
                    <Check size={14} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: C.charcoal, fontWeight: 500, lineHeight: 1.5 }}>{r.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section style={{ background: C.surface, padding: '80px 20px' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', marginBottom: 10 }}>Simple, honest pricing.</h2>
            <p style={{ color: C.slate, fontSize: 15 }}>No lock-in. Cancel anytime. All features included from day one.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Starter */}
            <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>Starter</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em' }}>₹799</span>
                <span style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>/month</span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 28 }}>Up to 25 beds · 1 property</p>
              <ul style={{ flex: 1, marginBottom: 28 }} className="space-y-3">
                {['Tenant management', 'Rent collection & tracking', 'Payment reminders', 'Expense tracking', 'Financial reports', 'Mobile PWA'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={13} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: C.charcoal }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'transparent', fontSize: 14, fontWeight: 600, color: C.charcoal, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Get started
              </button>
            </div>

            {/* Growth */}
            <div style={{ background: C.midnight, borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: C.green, color: '#fff', fontSize: 10, fontWeight: 800, padding: '5px 14px', borderRadius: '0 18px 0 12px', letterSpacing: '0.06em' }}>POPULAR</div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Growth</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>₹1,499</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>/month</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>Up to 100 beds · Multiple properties</p>
              <ul style={{ flex: 1, marginBottom: 28 }} className="space-y-3">
                {['Everything in Starter', 'Multiple properties', 'Advanced financial reports', 'Admin panel access', 'Priority support'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={13} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: f === 'Everything in Starter' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth} style={{ width: '100%', padding: '12px', borderRadius: 10, background: C.green, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
                onMouseLeave={e => e.currentTarget.style.background = C.green}
              >
                Get started
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 20 }}>
            Not sure which plan? <button onClick={tryDemo} style={{ color: C.green, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Try the live demo first →</button>
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: C.charcoal, letterSpacing: '-0.03em', marginBottom: 40, textAlign: 'center' }}>
            Common questions.
          </h2>
          <div>
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.midnight, padding: '80px 20px' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Stop managing your property<br />
            <span style={{ color: C.green }}>with spreadsheets.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
            Join operators who run their PG homes and hostels with clarity, precision, and zero paperwork.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={tryDemo} disabled={demoLoading}
              style={{ background: C.green, color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.greenHover}
              onMouseLeave={e => e.currentTarget.style.background = C.green}
            >
              {demoLoading && <Loader2 size={14} className="animate-spin" />}
              Try live demo <ArrowRight size={14} />
            </button>
            <button onClick={onShowAuth}
              style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
            >
              Create free account
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: C.charcoal, padding: '44px 20px 36px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-10 pb-10 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Brand */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <NivaLogo size={22} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>NivaOps</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                The operating system<br />for PG & hostel operators.
              </p>
            </div>
            {/* Links */}
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Demo'] },
              { heading: 'Support', links: ['Help Center', 'Contact', 'WhatsApp'] },
              { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
            ].map(col => (
              <div key={col.heading}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <button onClick={l === 'Demo' ? tryDemo : onShowAuth}
                        style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                      >
                        {l}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-7">
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2025 NivaOps · Property management, simplified.</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Built with care for operators who run real properties.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
