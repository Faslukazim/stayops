import { useState } from 'react';
import { signIn } from './services/authService';
import { NivaLogo, NivaWordmark } from './components/NivaLogo';
import { Check, Home, Users, IndianRupee, BarChart2, Loader2, Menu, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// MOCKUP COMPONENTS
// These use inline styles — they are pixel-precise graphic components,
// not layout. All section-level layout uses Tailwind classes only.
// ─────────────────────────────────────────────────────────────────────────────

function PhoneMockup() {
  const rows = [
    { n: 'Arjun Mehta',    r: 'Room 204', s: 'overdue', a: '₹8,500' },
    { n: 'Sneha Iyer',     r: 'Room 101', s: 'paid',    a: '₹7,500' },
    { n: 'Rohit Singh',    r: 'Room 305', s: 'pending', a: '₹6,500' },
    { n: 'Priya Nair',     r: 'Room 202', s: 'paid',    a: '₹9,000' },
  ];
  const badge = (s) => ({
    background: s === 'paid' ? '#DCFCE7' : s === 'overdue' ? '#FEF2F2' : '#FFFBEB',
    color:      s === 'paid' ? '#16A34A' : s === 'overdue' ? '#EF4444' : '#D97706',
  });

  return (
    <div style={{ position: 'relative', width: 280, height: 560 }}>
      {/* frame */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 50,
        background: '#0d1117',
        boxShadow: '0 60px 120px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* screen */}
        <div style={{
          position: 'absolute', inset: 3, borderRadius: 48,
          overflow: 'hidden', background: '#F8FAFC',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* status bar */}
          <div style={{ height: 40, background: '#111827', display: 'flex', alignItems: 'flex-end', padding: '0 20px 8px', flexShrink: 0, position: 'relative' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}>9:41</span>
            <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 68, height: 22, background: '#0d1117', borderRadius: 14 }} />
            <div style={{ marginLeft: 'auto', width: 13, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
          </div>
          {/* dashboard header */}
          <div style={{ background: '#111827', padding: '12px 20px 20px', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Dashboard</p>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: '-0.02em' }}>Today</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              {[
                { l: 'Occupancy',  v: '91%',        bg: 'rgba(255,255,255,0.07)',   vc: '#fff',     lc: 'rgba(255,255,255,0.35)' },
                { l: 'Revenue',    v: '₹2,45,800',  bg: 'rgba(22,163,74,0.18)',     vc: '#86efac',  lc: 'rgba(134,239,172,0.6)' },
                { l: 'Active',     v: '38',          bg: 'rgba(255,255,255,0.07)',   vc: '#fff',     lc: 'rgba(255,255,255,0.35)' },
                { l: 'Pending',    v: '6',           bg: 'rgba(251,191,36,0.12)',    vc: '#fbbf24',  lc: 'rgba(251,191,36,0.6)' },
              ].map(s => (
                <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ color: s.lc, fontSize: 9, marginBottom: 4 }}>{s.l}</p>
                  <p style={{ color: s.vc, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          {/* list */}
          <div style={{ flex: 1, padding: '16px 16px 0', overflow: 'hidden' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Due Today</p>
            {rows.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#16A34A', fontSize: 9, fontWeight: 700 }}>{t.n[0]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.n}</p>
                  <p style={{ fontSize: 9, color: '#94A3B8' }}>{t.r}</p>
                </div>
                <span style={{ fontSize: 8.5, fontWeight: 700, padding: '2.5px 8px', borderRadius: 99, ...badge(t.s) }}>{t.s}</span>
              </div>
            ))}
          </div>
          {/* bottom nav */}
          <div style={{ height: 52, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 28px', flexShrink: 0 }}>
            {[
              { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', a: true },
              { d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', a: false },
              { d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', a: false },
              { d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', a: false },
            ].map((n, i) => (
              <svg key={i} width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke={n.a ? '#16A34A' : 'rgba(255,255,255,0.2)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.d} />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserMockup() {
  const names = ['Arjun Mehta','Sneha Iyer','Rohit Singh','Priya Nair','Mohammed Salim','Ananya Das','Karthik Reddy','Divya Menon'];
  const rents = ['₹6,500','₹7,500','₹8,500','₹9,000'];
  const statuses = ['paid','paid','pending','overdue','paid','paid','pending','paid'];

  // 36 beds: 28 occupied · 6 vacant · 2 maintenance
  const beds = [
    ...['101A','101B','101C','101D','101E'].map((id,i) => ({ id, occ:true,  maint:false, name:names[i%8],     rent:rents[i%4],     status:statuses[i%8] })),
    { id:'101F', occ:false, maint:false },
    ...['102A','102B','102C','102D','102E'].map((id,i) => ({ id, occ:true,  maint:false, name:names[(i+3)%8], rent:rents[(i+1)%4], status:statuses[(i+3)%8] })),
    { id:'102F', occ:false, maint:false },
    ...['201A','201B','201C','201D'].map((id,i)        => ({ id, occ:true,  maint:false, name:names[(i+5)%8], rent:rents[(i+2)%4], status:statuses[(i+5)%8] })),
    { id:'201E', occ:false, maint:true  },
    { id:'201F', occ:false, maint:true  },
    ...['202A','202B','202C','202D','202E'].map((id,i) => ({ id, occ:true,  maint:false, name:names[(i+1)%8], rent:rents[(i+3)%4], status:statuses[(i+1)%8] })),
    { id:'202F', occ:false, maint:false },
    ...['301A','301B','301C','301D','301E'].map((id,i) => ({ id, occ:true,  maint:false, name:names[(i+4)%8], rent:rents[i%4],     status:statuses[(i+4)%8] })),
    { id:'301F', occ:false, maint:false },
    ...['302A','302B','302C','302D'].map((id,i)        => ({ id, occ:true,  maint:false, name:names[(i+2)%8], rent:rents[(i+1)%4], status:statuses[(i+2)%8] })),
    { id:'302E', occ:false, maint:false },
    { id:'302F', occ:false, maint:false },
  ];

  const nav = ['Dashboard','Properties','Rooms','Tenants','Payments','Reports','Settings'];

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(15,23,42,0.12)', background: '#fff' }}>
      {/* browser chrome */}
      <div style={{ background: '#111827', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 7, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>app.nivaops.com</span>
        </div>
      </div>
      {/* panels */}
      <div style={{ display: 'flex', height: 400 }}>

        {/* LEFT: sidebar */}
        <div style={{ width: 160, background: '#111827', padding: '14px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
            <img src="/favicon.svg" width="18" height="18" alt="" style={{ borderRadius: 4, flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>NivaOps</span>
          </div>
          {nav.map((label, i) => {
            const active = label === 'Rooms';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', margin: '1px 8px', borderRadius: 7, background: active ? 'rgba(22,163,74,0.14)' : 'transparent' }}>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#16A34A' : 'rgba(255,255,255,0.38)' }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* CENTRE: room grid */}
        <div style={{ flex: 1, background: '#F8FAFC', padding: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Rooms</p>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>42 beds · 38 occupied</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#DCFCE7', color: '#16A34A' }}>38 Occupied</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#F1F5F9', color: '#475569' }}>4 Vacant</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {beds.map(b => (
              <div key={b.id} style={{
                borderRadius: 8, padding: '7px 8px',
                background: b.maint ? 'rgba(217,119,6,0.07)' : b.occ ? '#111827' : '#fff',
                border: b.occ ? 'none' : b.maint ? '1px solid rgba(217,119,6,0.2)' : '1px solid #E2E8F0',
              }}>
                <p style={{ fontSize: 8.5, fontWeight: 700, lineHeight: 1, color: b.occ ? '#fff' : b.maint ? '#D97706' : '#94A3B8' }}>{b.id}</p>
                {b.occ && (
                  <>
                    <p style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.5)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name.split(' ')[0]}</p>
                    <p style={{ fontSize: 7, color: '#16A34A', marginTop: 2 }}>{b.rent}</p>
                  </>
                )}
                {!b.occ && !b.maint && <p style={{ fontSize: 7.5, color: '#CBD5E1', marginTop: 3 }}>Vacant</p>}
                {b.maint && <p style={{ fontSize: 7.5, color: '#D97706', marginTop: 3 }}>Maint.</p>}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: tenant detail */}
        <div style={{ width: 220, background: '#fff', borderLeft: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <p style={{ fontSize: 9.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Tenant Details</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, padding: '9px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>AM</span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>Arjun Mehta</p>
              <p style={{ fontSize: 9, color: '#94A3B8' }}>Room 204 · Bed B</p>
            </div>
          </div>
          {[
            { l:'Rent',    v:'₹8,500/month', badge:null },
            { l:'Status',  v:null,           badge:'Paid' },
            { l:'Joined',  v:'12 Jan 2025',  badge:null },
            { l:'Phone',   v:'+91 98800 00001', badge:null },
            { l:'Deposit', v:'₹17,000',      badge:null },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5.5px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 9.5, color: '#94A3B8' }}>{row.l}</span>
              {row.badge
                ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#DCFCE7', color: '#16A34A' }}>{row.badge}</span>
                : <span style={{ fontSize: 9.5, fontWeight: 500, color: '#0F172A' }}>{row.v}</span>
              }
            </div>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <button style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              Send Reminder
            </button>
            <button style={{ width: '100%', padding: '7px', borderRadius: 8, border: 'none', background: '#16A34A', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              Collect Rent
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

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

  function scrollToProduct() {
    document.getElementById('product-showcase')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NivaLogo size={22} />
            <NivaWordmark size="base" />
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={onShowAuth}
              className="text-sm text-slate font-medium px-4 py-2 rounded-lg hover:bg-surface transition-colors">
              Sign in
            </button>
            <button onClick={onShowAuth}
              className="text-sm text-white font-semibold px-4 py-2 rounded-lg bg-green hover:bg-green-hover transition-colors">
              Get started free
            </button>
          </div>
          <button className="sm:hidden p-2 text-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-border px-5 pb-5 pt-3 space-y-2">
            <button onClick={onShowAuth} className="w-full py-2.5 border border-border rounded-lg text-sm font-semibold text-charcoal hover:bg-light transition-colors">Sign in</button>
            <button onClick={onShowAuth} className="w-full py-2.5 bg-green hover:bg-green-hover rounded-lg text-sm font-semibold text-white transition-colors">Get started free</button>
          </div>
        )}
      </nav>

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-0 px-5 bg-white">
        <div className="max-w-3xl mx-auto text-center">

          <h1 className="text-[56px] sm:text-[64px] font-bold text-charcoal tracking-[-1.5px] leading-[1.1] mb-5">
            Stop managing your hostel<br className="hidden sm:block" /> on WhatsApp.
          </h1>

          <p className="text-[18px] text-slate leading-[1.65] max-w-xl mx-auto mb-7">
            Know who paid, who hasn't, and which beds<br className="hidden sm:block" /> are empty — right now.
          </p>

          <p className="text-sm font-medium text-muted tracking-wide mb-9">
            Trusted by 50+ hostel operators across India
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            <button onClick={onShowAuth}
              className="w-full sm:w-auto bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors duration-150">
              Get started free
            </button>
            <button onClick={scrollToProduct}
              className="sm:ml-6 text-sm font-medium text-slate hover:text-charcoal transition-colors">
              See how it works →
            </button>
          </div>

          {demoError && <p className="text-error text-sm mt-4">{demoError}</p>}

          {/* Phone mockup */}
          <div className="relative mt-16 flex justify-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 600px 400px at 50% 50%, rgba(22,163,74,0.12) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0,
              }}
            />
            <div className="relative" style={{ zIndex: 1 }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PRODUCT SHOWCASE ─────────────────────────────────────────────── */}
      <section id="product-showcase" className="py-24 px-5 bg-light">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-muted text-center mb-8">
            This is what your property looks like inside NivaOps.
          </p>
          <BrowserMockup />
        </div>
      </section>

      {/* ── 3. FOUR WORKFLOW CARDS ──────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[40px] font-bold text-charcoal tracking-[-0.5px] text-center mb-16">
            Everything your hostel<br className="hidden sm:block" /> needs to run smoothly.
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                Icon: IndianRupee,
                title: 'Rent Collection',
                body: 'Send WhatsApp payment reminders with UPI links in one tap. Know who paid, who\'s late, and who needs a follow-up.',
              },
              {
                Icon: Users,
                title: 'Tenant Tracking',
                body: 'Every tenant\'s details, documents, and payment history in one place. Nothing lost in WhatsApp threads again.',
              },
              {
                Icon: Home,
                title: 'Room Management',
                body: 'See every bed — occupied, vacant, or under maintenance. Move tenants, update rooms, track joining dates instantly.',
              },
              {
                Icon: BarChart2,
                title: 'Expense Tracking',
                body: 'Track maintenance costs, utility bills, and staff expenses. See exactly where every rupee goes each month.',
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-white border border-border rounded-xl p-8 hover:shadow-card transition-shadow duration-200">
                <Icon size={20} className="text-green mb-4" />
                <h3 className="text-[20px] font-semibold text-charcoal mb-2">{title}</h3>
                <p className="text-[16px] text-slate leading-[1.6]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-light">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-[40px] font-bold text-charcoal tracking-[-0.5px]">Simple, honest pricing.</h2>
            <p className="text-[18px] text-slate mt-2">Everything you need. Nothing you don't.</p>
          </div>
          <p className="text-sm font-medium text-slate text-center mb-12">
            Competitors charge ₹4,599–₹10,899/month for the same.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Starter */}
            <div className="bg-white border border-border rounded-2xl p-8 flex flex-col">
              <p className="text-sm font-semibold text-slate uppercase tracking-[1.5px] mb-5">Starter</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[64px] font-bold text-charcoal leading-none tracking-[-2px]">₹799</span>
                <span className="text-base text-slate font-normal">/month</span>
              </div>
              <p className="text-sm text-slate mb-6">For operators managing up to 25 beds.</p>
              <div className="border-t border-border mb-6" />
              <ul className="space-y-3 flex-1">
                {['Bed & tenant management','Rent collection tracking','WhatsApp reminders + UPI links','Expense tracking','Mobile PWA'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-green shrink-0 mt-0.5" />
                    <span className="text-sm text-slate">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth}
                className="mt-8 w-full py-3 border border-border rounded-lg text-sm font-semibold text-charcoal hover:bg-light transition-colors">
                Get started free
              </button>
              <p className="text-xs text-muted text-center mt-2">No credit card required</p>
            </div>

            {/* Pro */}
            <div className="bg-midnight rounded-2xl p-8 flex flex-col">
              <span className="inline-block bg-green text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 self-start">
                Most popular
              </span>
              <p className="text-sm font-semibold text-white/60 uppercase tracking-[1.5px] mb-5">Pro</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[64px] font-bold text-white leading-none tracking-[-2px]">₹1,499</span>
                <span className="text-base text-white/60 font-normal">/month</span>
              </div>
              <p className="text-sm text-white/50 mb-6">For operators managing up to 100 beds.</p>
              <div className="border-t border-white/10 mb-6" />
              <ul className="space-y-3 flex-1">
                {['Everything in Starter','Multiple properties','Advanced reports','Admin panel access','Priority support'].map((f, i) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-green shrink-0 mt-0.5" />
                    <span className={`text-sm ${i === 0 ? 'text-white/40' : 'text-white/70'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onShowAuth}
                className="mt-8 w-full py-3 bg-green hover:bg-green-hover rounded-lg text-sm font-semibold text-white transition-colors">
                Get started free
              </button>
              <p className="text-xs text-white/40 text-center mt-2">No credit card required</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-midnight">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[40px] font-bold text-white tracking-[-0.5px] leading-[1.1] mb-4">
            Your next tenant check-in<br className="hidden sm:block" /> shouldn't involve a notebook.
          </h2>
          <p className="text-sm font-medium text-white/50 italic mb-8">
            Rahul from Bangalore set up his 40-bed hostel in under 10 minutes.
          </p>
          <button onClick={onShowAuth}
            className="block mx-auto bg-green hover:bg-green-hover text-white font-semibold text-base px-8 py-4 rounded-lg transition-colors">
            Get started free
          </button>
          <p className="text-sm text-white/40 mt-5">
            No spreadsheets. No paper registers. No missed payments.
          </p>
        </div>
      </section>

      {/* ── 6. FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-midnight border-t border-white/10 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* left */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <NivaLogo size={20} />
              <span className="text-white font-semibold text-sm">NivaOps</span>
            </div>
            <p className="text-white/30 text-xs">Run properties smarter.</p>
          </div>
          {/* centre */}
          <div className="flex items-center gap-8">
            {[
              { label: 'Features',  action: scrollToProduct },
              { label: 'Pricing',   action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Contact',   action: onShowAuth },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                className="text-sm text-white/40 hover:text-white/70 transition-colors">
                {label}
              </button>
            ))}
          </div>
          {/* right */}
          <p className="text-xs text-white/30">© 2025 NivaOps</p>
        </div>
      </footer>

    </div>
  );
}
