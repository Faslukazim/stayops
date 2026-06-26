import { Clock } from 'lucide-react';
import { SignOutBtn } from './components/ui';
import { NivaLogo } from './components/NivaLogo';

export default function WaitlistPage({ email, onSignOut }) {
  return (
    <div className="min-h-screen bg-mist flex flex-col items-center justify-center px-5 text-center">
      <NivaLogo size={56} className="mb-6" />

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/10 mb-4">
        <Clock className="h-6 w-6 text-amber" />
      </div>

      <h1 className="text-xl font-bold text-ink">You're on the waitlist</h1>
      <p className="mt-2 text-sm text-slate2 max-w-xs leading-relaxed">
        Thanks for signing up{email ? ` as ${email}` : ''}. We'll reach out soon to get you set up.
      </p>

      <a
        href="https://wa.me/919633310117?text=Hi%2C%20I%20signed%20up%20for%20NivaOps%20and%20would%20like%20to%20get%20access"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald/90 transition-colors"
      >
        Message us on WhatsApp to speed it up
      </a>

      <div className="mt-6"><SignOutBtn onSignOut={onSignOut} /></div>
    </div>
  );
}
