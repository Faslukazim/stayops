import { useState } from 'react';
import { Loader2, ArrowRight, BedDouble, CreditCard, Users, BarChart2, CheckCircle2, Zap, Shield, Smartphone } from 'lucide-react';
import { signIn } from './services/authService';
import { NivaLogo, NivaWordmark } from './components/NivaLogo';

const FEATURES = [
  {
    icon: BedDouble,
    title: 'Room & bed management',
    body: 'See every bed at a glance. Track occupancy, assign tenants, and spot vacancies instantly.',
  },
  {
    icon: CreditCard,
    title: 'Rent collection',
    body: 'Mark payments, send reminders, and know exactly who has paid — all from your phone.',
  },
  {
    icon: Users,
    title: 'Tenant records',
    body: 'ID photos, join dates, deposits, and history — everything in one place per tenant.',
  },
  {
    icon: BarChart2,
    title: 'Finance overview',
    body: 'Monthly P&L, income breakdown, and expenses. Know your numbers without an accountant.',
  },
];

const WHY = [
  { icon: Smartphone, title: 'Built for your phone', body: 'No desktop required. Run your property from anywhere, on any Android or iPhone.' },
  { icon: Zap,        title: 'Zero training needed', body: 'Designed for operators, not accountants. You\'ll be set up in under 10 minutes.' },
  { icon: Shield,     title: 'Your data, secured',   body: 'Every tenant record is private to your account. Backed by enterprise-grade infrastructure.' },
];

export default function LandingPage({ onShowAuth }) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  async function tryDemo() {
    setDemoLoading(true);
    setDemoError('');
    try {
      await signIn('demo@stayops.com', 'demo2026'); // demo account unchanged
    } catch {
      setDemoError('Demo unavailable right now. Try again in a moment.');
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="bg-white sticky top-0 z-50 border-b border-border px-5 flex items-center justify-between"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: '1rem' }}
      >
        <div className="flex items-center gap-2.5">
          <NivaLogo size={28} />
          <NivaWordmark size="lg" />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onShowAuth}
            className="bg-white border border-border text-charcoal hover:bg-light px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={tryDemo}
            disabled={demoLoading}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald text-white px-4 py-2 text-sm font-semibold hover:bg-emerald/90 transition-colors disabled:opacity-60"
          >
            {demoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Try demo
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-white flex flex-col items-center text-center px-5 pt-16 pb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 text-emerald text-xs font-semibold px-3 py-1 border border-emerald/20 mb-6">
          Hostels · Co-living · Boarding houses · PGs
        </span>

        <h1 className="font-marketing text-[2.25rem] sm:text-5xl font-extrabold text-charcoal leading-[1.15] max-w-md tracking-tight">
          The operating system for modern rental properties.
        </h1>

        <p className="mt-5 text-slate text-base sm:text-lg max-w-sm leading-relaxed">
          NivaOps helps PG and hostel operators manage beds, collect rent, track tenants — all from their phone.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button
            type="button"
            onClick={tryDemo}
            disabled={demoLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald text-white px-6 py-3 text-sm font-semibold hover:bg-emerald/90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md"
          >
            {demoLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ArrowRight className="h-4 w-4" />}
            Try live demo — free
          </button>
          <button
            type="button"
            onClick={onShowAuth}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-border text-charcoal px-6 py-3 text-sm font-semibold hover:bg-light active:scale-[0.98] transition-all"
          >
            Request early access
          </button>
        </div>

        {demoError && <p className="mt-3 text-sm text-error">{demoError}</p>}
        <p className="mt-3 text-xs text-slate">No account needed · No credit card</p>
      </section>

      {/* ── Social proof strip ───────────────────────────────────────────── */}
      <div className="border-y border-border bg-surface px-5 py-5">
        <div className="max-w-xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold text-slate text-center">
          <span>✓ 100+ beds managed daily</span>
          <span>✓ Works on Android & iPhone</span>
          <span>✓ No setup fee</span>
          <span>✓ 5-minute onboarding</span>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-16 max-w-2xl mx-auto w-full">
        <h2 className="text-center text-xl font-bold text-charcoal mb-2">Everything you need. Nothing you don't.</h2>
        <p className="text-center text-sm text-slate mb-8">Designed for operators who manage beds, not software engineers.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/10 mb-3">
                <Icon className="text-emerald" size={18} />
              </div>
              <p className="text-sm font-bold text-charcoal">{title}</p>
              <p className="mt-1.5 text-xs text-slate leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why NivaOps ─────────────────────────────────────────────────── */}
      <section className="bg-midnight text-white px-5 py-14">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl font-bold mb-2">Why operators choose NivaOps</h2>
          <p className="text-center text-white/50 text-sm mb-10">Run properties smarter. Delight residents. Grow with confidence.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="text-white" size={18} />
                </div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-white/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="bg-light px-5 py-16 max-w-2xl mx-auto w-full">
        <h2 className="text-center text-xl font-bold text-charcoal mb-2">Simple, honest pricing</h2>
        <p className="text-center text-sm text-slate mb-10">No contracts. No setup fee. Cancel anytime.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Starter */}
          <div className="bg-white rounded-2xl border border-border p-8 flex flex-col">
            <p className="text-xs font-bold text-slate tracking-widest uppercase mb-3">Starter</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-extrabold text-charcoal">₹799</span>
              <span className="text-sm text-slate mb-1">/month</span>
            </div>
            <p className="text-xs text-slate mb-6">Up to 30 beds · 1 property</p>
            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {['Rooms & bed management','Tenant records + ID photos','Rent tracking & reminders','Expense tracking','Monthly P&L'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-charcoal">
                  <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onShowAuth}
              className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-white text-charcoal py-2.5 text-sm font-bold hover:bg-light transition-colors"
            >
              Get started
            </button>
          </div>

          {/* Growth */}
          <div className="bg-midnight rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 rounded-full bg-emerald text-white text-[10px] font-bold px-2.5 py-0.5 tracking-wide uppercase">
              Popular
            </div>
            <p className="text-xs font-bold text-white/50 tracking-widest uppercase mb-3">Growth</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-extrabold text-white">₹1,499</span>
              <span className="text-sm text-white/50 mb-1">/month</span>
            </div>
            <p className="text-xs text-white/50 mb-6">Up to 100 beds · 3 properties</p>
            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {['Everything in Starter','Multiple properties','Deposit management','Income records & day guests','Cashflow tracking'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onShowAuth}
              className="w-full inline-flex items-center justify-center rounded-xl bg-emerald text-white py-2.5 text-sm font-bold hover:bg-emerald/90 transition-colors"
            >
              Get started
            </button>
          </div>

        </div>

        <p className="text-center text-xs text-slate mt-6">
          More than 100 beds?{' '}
          <a href="mailto:hello@nivaops.com" className="font-semibold text-charcoal hover:underline">
            Talk to us
          </a>{' '}
          for a custom plan.
        </p>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-16 flex flex-col items-center text-center">
        <h2 className="text-2xl font-extrabold text-charcoal mb-2 tracking-tight">Ready to ditch the spreadsheet?</h2>
        <p className="text-slate text-sm mb-8 max-w-xs">Try a live demo with real data — no signup, no commitment.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={tryDemo}
            disabled={demoLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald text-white px-7 py-3.5 text-sm font-bold hover:bg-emerald/90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md"
          >
            {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Try live demo
          </button>
          <a
            href="mailto:hello@nivaops.com"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-border text-charcoal px-7 py-3.5 text-sm font-bold hover:bg-light active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald" />
            Get in touch
          </a>
        </div>
        {demoError && <p className="mt-3 text-sm text-error">{demoError}</p>}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-midnight text-white px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-white/10">
        <div className="flex items-center gap-2">
          <NivaLogo size={20} />
          <span className="text-white/60">© {new Date().getFullYear()} NivaOps</span>
        </div>
        <div className="flex items-center gap-5">
          <button type="button" onClick={onShowAuth} className="text-white/60 hover:text-white transition-colors">Sign in</button>
          <a href="mailto:hello@nivaops.com" className="text-white/60 hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
