import { useEffect, useState } from 'react';
import { X, Phone, MessageCircle, CheckCircle2, Pencil, Trash2, Loader2 } from 'lucide-react';
import { fmt, Label, Btn, IconBtn, ConfirmInline, CollectModal } from './components/ui';
import { fetchTenantPaymentHistory } from './services/paymentService';
import { computeTenantStatus, STATUS } from './utils/paymentStatus';

const STATUS_PILL = {
  [STATUS.PAID]:     { label: 'Paid',      cls: 'bg-leaf/10 text-leaf' },
  [STATUS.DUE_SOON]: { label: 'Due Soon',  cls: 'bg-amber/10 text-amber' },
  [STATUS.DUE_TODAY]:{ label: 'Due Today', cls: 'bg-amber/10 text-amber' },
  [STATUS.OVERDUE]:  { label: 'Overdue',   cls: 'bg-coral/10 text-coral' },
  [STATUS.UPCOMING]: { label: 'Upcoming',  cls: 'bg-mist text-slate2' },
};

export default function TenantProfile({ tenant, properties, onClose, onCollect, onEdit, onDelete }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showCollect, setShowCollect] = useState(false);

  useEffect(() => {
    setLoadingHistory(true);
    fetchTenantPaymentHistory(tenant.id)
      .then(h => { setHistory(h); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  }, [tenant.id]);

  const status = computeTenantStatus(tenant);
  const pill = STATUS_PILL[status] ?? STATUS_PILL[STATUS.UPCOMING];
  const property = properties?.find(p => p.id === tenant.propertyId);

  const phone = String(tenant.phone).replace(/\D/g, '');
  const waMsg = `Hi ${tenant.name}, rent reminder for Room ${tenant.roomNumber} Bed ${tenant.bedNumber}. Monthly rent ${fmt(tenant.monthlyRent)} is unpaid. Please pay at your earliest.`;
  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`;
  const callHref = `tel:${tenant.phone}`;

  function ymDisplay(ym) {
    return new Date(ym + '-02').toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40" aria-hidden />

      <div className="fixed z-50 bg-white overflow-y-auto
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[90dvh]
        sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto sm:w-[22rem] sm:rounded-none sm:rounded-l-2xl sm:max-h-none sm:h-full">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4 bg-white border-b border-border">
          <div className="min-w-0">
            <p className="font-bold text-ink text-lg leading-tight truncate">{tenant.name}</p>
            <p className="text-sm text-slate2 mt-0.5">Room {tenant.roomNumber} · Bed {tenant.bedNumber}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pill.cls}`}>{pill.label}</span>
            <IconBtn variant="ghost" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </IconBtn>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Contact */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Label>Phone</Label>
              <p className="mt-0.5 text-sm font-semibold text-ink">{tenant.phone}</p>
            </div>
            <a href={callHref}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-ink hover:bg-mist transition-colors">
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a href={waHref} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-ink hover:bg-mist transition-colors">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-mist p-4">
            <div>
              <Label>Monthly Rent</Label>
              <p className="mt-0.5 text-sm font-semibold text-ink">{fmt(tenant.monthlyRent)}</p>
            </div>
            <div>
              <Label>Rent Due Day</Label>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {tenant.rentDueDay ? `${tenant.rentDueDay}th of month` : '—'}
              </p>
            </div>
            <div>
              <Label>Move-In Date</Label>
              <p className="mt-0.5 text-sm font-semibold text-ink">{tenant.joinDate ?? '—'}</p>
            </div>
            <div>
              <Label>Property</Label>
              <p className="mt-0.5 text-sm font-semibold text-ink truncate">{property?.name ?? '—'}</p>
            </div>
          </div>

          {/* Deposit + Admission */}
          {(tenant.depositAmount > 0 || tenant.admissionFee > 0) && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4">
              {tenant.admissionFee > 0 && (
                <div>
                  <Label>Admission Fee</Label>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{fmt(tenant.admissionFee)}</p>
                  <p className="text-xs text-slate2">non-refundable</p>
                </div>
              )}
              {tenant.depositAmount > 0 && (
                <div>
                  <Label>Security Deposit</Label>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{fmt(tenant.depositAmount)}</p>
                  <p className={`text-xs ${
                    tenant.depositStatus === 'returned' ? 'text-leaf' :
                    tenant.depositStatus === 'forfeited' ? 'text-coral' : 'text-slate2'
                  }`}>
                    {tenant.depositStatus === 'returned' ? 'Returned' :
                     tenant.depositStatus === 'forfeited' ? 'Not refundable' : 'Held'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Primary actions */}
          <div className="flex flex-col gap-2">
            {status !== STATUS.PAID && (
              <Btn variant="filled-success" className="w-full justify-center py-3" onClick={() => setShowCollect(true)}>
                <CheckCircle2 className="h-4 w-4" />
                Collect Rent
              </Btn>
            )}
            <Btn variant="secondary" className="w-full justify-center" onClick={() => { onClose(); onEdit(tenant); }}>
              <Pencil className="h-4 w-4" />
              Edit Tenant
            </Btn>
          </div>

          {/* Payment history */}
          <div>
            <Label>Payment History</Label>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate2" />
              </div>
            ) : history.length === 0 ? (
              <p className="mt-2 text-sm text-slate2">No payment records found.</p>
            ) : (
              <div className="mt-2 flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                {history.map(h => (
                  <div key={h.month} className="flex items-center justify-between px-4 py-2.5 bg-white">
                    <div>
                      <p className="text-sm font-semibold text-ink">{ymDisplay(h.month)}</p>
                      {h.status === 'paid' && h.paid_at && (
                        <p className="text-xs text-slate2">Paid {String(h.paid_at).slice(0, 10)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-ink">
                        {h.amount_collected != null ? fmt(h.amount_collected) : fmt(h.amount)}
                      </p>
                      <span className={`text-xs font-semibold ${h.status === 'paid' ? 'text-leaf' : 'text-coral'}`}>
                        {h.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Move out */}
          <div className="border-t border-border pt-4">
            {confirmingDelete ? (
              <ConfirmInline
                message={<>Move out <span className="font-semibold">{tenant.name}</span>? This frees Bed {tenant.bedNumber} in Room {tenant.roomNumber}.</>}
                confirmLabel="Confirm Move Out"
                onCancel={() => setConfirmingDelete(false)}
                onConfirm={() => { onDelete(tenant); onClose(); }}
              />
            ) : (
              <Btn variant="danger" className="w-full justify-center" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Move Out Tenant
              </Btn>
            )}
          </div>
        </div>
      </div>

      {showCollect && (
        <CollectModal
          record={{ amount: tenant.monthlyRent, name: tenant.name, roomNumber: tenant.roomNumber, bedNumber: tenant.bedNumber }}
          onConfirm={(amt, reason) => { setShowCollect(false); onCollect(tenant, amt, reason); }}
          onCancel={() => setShowCollect(false)}
        />
      )}
    </>
  );
}
