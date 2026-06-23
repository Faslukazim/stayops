import { useState } from 'react';
import { Loader2, ArrowRight, BedDouble, IndianRupee, Users, BarChart2, CheckCircle2 } from 'lucide-react';
import { signIn } from './services/authService';

const FEATURES = [
  { icon: BedDouble,    title: 'Room & bed management', body: 'Track every bed, assign tenants, and see occupancy at a glance.' },
  { icon: IndianRupee,  title: 'Rent collection',       body: 'Mark payments paid or unpaid. Send WhatsApp reminders with one tap.' },
  { icon: Users,        title: 'Tenant profiles',       body: 'Store ID photos, join dates, and deposit status for every tenant.' },
  { icon: BarChart2,    title: 'Finance overview',      body: 'Monthly P&L, income breakdown, and expense tracking in one view.' },
];

export default function LandingPage({ onShowAuth }) {
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

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="StayOps" width="34" height="34" className="rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">StayOps</span>
        </div>
        <button
          type="button"
          onClick={onShowAuth}
          className="text-sm font-semibold text-slate2 hover:text-ink transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-5 pt-16 pb-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3 py-1 text-xs font-semibold text-leaf mb-5">
          Built for Indian PG operators
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink leading-tight max-w-md">
          Run your PG without the chaos
        </h1>
        <p className="mt-4 text-slate2 text-base max-w-sm leading-relaxed">
          Rooms, tenants, rent collection, and finances — all in one place. Works on phone.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button
            type="button"
            onClick={tryDemo}
            disabled={demoLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white px-6 py-3 text-sm font-semibold hover:bg-ink/90 active:bg-ink/80 transition-colors disabled:opacity-60"
          >
            {demoLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ArrowRight className="h-4 w-4" />}
            Try live demo
          </button>
          <button
            type="button"
            onClick={onShowAuth}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-border text-ink px-6 py-3 text-sm font-semibold hover:bg-mist transition-colors"
          >
            Request access
          </button>
        </div>
        {demoError && <p className="mt-3 text-sm text-coral">{demoError}</p>}
        <p className="mt-3 text-xs text-slate2">No account needed for the demo</p>
      </section>

      {/* Features */}
      <section className="px-5 pb-16 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-border p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 mb-3">
                <Icon className="h-4.5 w-4.5 text-ink" size={18} />
              </div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-xs text-slate2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-ink text-white px-5 py-10 text-center">
        <h2 className="text-xl font-bold mb-2">Ready to bring your PG online?</h2>
        <p className="text-white/60 text-sm mb-6">Contact us to get access for your property.</p>
        <a
          href="https://wa.me/919633310117?text=Hi%2C%20I%27d%20like%20to%20get%20access%20to%20StayOps"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-leaf px-6 py-3 text-sm font-semibold text-white hover:bg-leaf/90 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          Contact on WhatsApp
        </a>
      </section>

      <footer className="text-center py-5 text-xs text-slate2">
        © {new Date().getFullYear()} StayOps
      </footer>
    </div>
  );
}
