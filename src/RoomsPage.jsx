import { useEffect, useState, useMemo } from 'react';
import { useToast } from './lib/toast.jsx';
import { ArrowLeft, ArrowRightLeft, BedDouble, Bookmark, Check, ChevronDown, Loader2, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { fetchRoomsWithOccupants, createRoom, deleteRoom, deleteBed, updateRoomNumber } from './services/propertyService';
import { deleteTenant, moveTenant, updateTenant } from './services/tenantService';
import { createBooking, cancelBooking, convertBooking } from './services/bookingService';
import { markTenantRecordPaid } from './services/paymentService';
import { logActivity } from './services/activityService';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, PaymentToggleBtn, WhatsAppLink,
  PageLoader, StatStrip, ConfirmInline, EmptyState, CollectModal,
} from './components/ui';

// ─── Occupancy bar ────────────────────────────────────────────────────────────

function OccBar({ occupied, capacity }) {
  const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className="h-full rounded-full bg-green transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({ room, isSelected, onClick }) {
  const occupied = room.beds.filter(b => b.tenant).length;
  const capacity = room.beds.length;
  const unpaid = room.beds.filter(b => b.occupancy?.payment_status === 'Unpaid').length;
  const isEmpty = occupied === 0;
  const isFull = occupied === capacity;

  const badgeStatus = unpaid > 0 ? 'unpaid' : isFull ? 'paid' : isEmpty ? 'empty' : null;
  const badgeLabel = unpaid > 0 ? `${unpaid} unpaid` : isFull ? 'All paid' : isEmpty ? 'Empty' : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.98] ${
        isSelected
          ? 'border-green bg-green/5 shadow-lift'
          : 'border-border bg-white hover:border-slate/60 shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-charcoal">Room {room.room_number}</p>
          {isSelected && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-green">Selected</span>
          )}
        </div>
        {badgeStatus && <StatusBadge status={badgeStatus} label={badgeLabel} />}
      </div>

      <p className="mt-1 text-slate text-sm">
        {occupied} Occupied · {capacity - occupied} Vacant
      </p>

      <OccBar occupied={occupied} capacity={capacity} />

      <div className="mt-3 flex gap-2">
        {Array.from({ length: capacity }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-sm ${
              i < occupied ? 'bg-green' : isSelected ? 'bg-green/25 border border-green/40' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {occupied > 0 && (
        <p className="mt-2 text-xs text-slate2 truncate">
          {room.beds.filter(b => b.tenant).map(b => b.tenant.name.split(' ')[0]).join(' · ')}
        </p>
      )}
    </button>
  );
}

// ─── Move bed form ────────────────────────────────────────────────────────────

function MoveBedForm({ tenant, fromRoomId, rooms, onConfirm, onCancel, saving }) {
  const [destRoomId, setDestRoomId] = useState('');
  const [destBedId, setDestBedId] = useState('');

  const eligibleRooms = rooms.filter(r => r.id !== fromRoomId && r.beds.some(b => !b.tenant));
  const destRoom = rooms.find(r => r.id === destRoomId);
  const availableBeds = destRoom?.beds?.filter(b => !b.tenant) ?? [];

  const selectCls = 'w-full appearance-none rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink disabled:bg-mist disabled:text-slate2';

  return (
    <div className="border-t border-border bg-mist px-4 py-3">
      <p className="text-xs font-semibold text-ink mb-3">
        Move {tenant.name} to a new bed
      </p>

      {eligibleRooms.length === 0 ? (
        <p className="text-sm text-slate2 mb-3">No available beds in other rooms.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2">
          <label className="block">
            <Label>Room</Label>
            <div className="relative mt-1">
              <select
                value={destRoomId}
                onChange={e => { setDestRoomId(e.target.value); setDestBedId(''); }}
                className={selectCls}
              >
                <option value="">Select room</option>
                {eligibleRooms.map(r => {
                  const free = r.beds.filter(b => !b.tenant).length;
                  return <option key={r.id} value={r.id}>Room {r.room_number} ({free} free)</option>;
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate2" />
            </div>
          </label>
          <label className="block">
            <Label>Bed</Label>
            <div className="relative mt-1">
              <select
                value={destBedId}
                onChange={e => setDestBedId(e.target.value)}
                disabled={!destRoomId}
                className={selectCls}
              >
                <option value="">Select bed</option>
                {availableBeds.map(b => (
                  <option key={b.id} value={b.id}>Bed {b.bed_number}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate2" />
            </div>
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Btn variant="secondary" size="sm" onClick={onCancel}>Cancel</Btn>
        <Btn
          variant="primary"
          size="sm"
          disabled={!destRoomId || !destBedId || saving}
          onClick={() => onConfirm(destRoomId, destBedId, destRoom?.room_number)}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Confirm move
        </Btn>
      </div>
    </div>
  );
}

// ─── Book bed form ────────────────────────────────────────────────────────────

function BookBedForm({ bedNumber, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [advance, setAdvance] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputCls = 'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required.'); return; }
    setErr(''); setSaving(true);
    try {
      await onSave({ name: name.trim(), phone: phone.trim(), advanceAmount: Number(advance) || 0, expectedJoinDate: joinDate || null });
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-border bg-mist px-4 py-3">
      <p className="text-xs font-semibold text-ink mb-3">Book Bed {bedNumber}</p>
      {err && <p className="mb-2 text-xs text-coral">{err}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input autoFocus value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Visitor name *" />
        <input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Phone number" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" value={advance} onChange={e => setAdvance(e.target.value)} className={inputCls} placeholder="Advance paid (₹)" />
          <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" size="sm" onClick={onCancel} {...{ type: 'button' }}>Cancel</Btn>
          <Btn variant="primary" size="sm" disabled={saving} {...{ type: 'submit' }}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Booking
          </Btn>
        </div>
      </form>
    </div>
  );
}

// ─── Bed row ──────────────────────────────────────────────────────────────────

function BedRow({ bed, roomNumber, roomId, rooms, upiId, onMarkPaid, onMarkUnpaid, onVacate, onMove, onViewTenant, onDeleteBed, onBook, onCancelBooking, onConvertBooking, onAssign }) {
  const occ = bed.occupancy;
  const tenant = bed.tenant;
  const booking = bed.booking;
  const isPaid = occ?.payment_status === 'Paid';
  const [confirming, setConfirming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveSaving, setMoveSaving] = useState(false);
  const [confirmDeleteBed, setConfirmDeleteBed] = useState(false);
  const [booking_, setBooking_] = useState(false);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState(false);

  if (!tenant) {
    // Booked bed
    if (booking) {
      if (confirmCancelBooking) {
        return (
          <ConfirmInline
            message={<>Cancel booking for <span className="font-semibold">{booking.name}</span>?</>}
            confirmLabel="Cancel Booking"
            onCancel={() => setConfirmCancelBooking(false)}
            onConfirm={async () => { await onCancelBooking(booking.id, bed.id); }}
          />
        );
      }
      return (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/10 text-xs font-semibold tabular-nums text-amber shrink-0">
              {bed.bed_number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{booking.name}</p>
              <p className="text-xs text-slate2 truncate">
                {booking.advance_amount > 0 ? `Advance ₹${booking.advance_amount}` : 'No advance'}
                {booking.expected_join_date ? ` · Joining ${booking.expected_join_date}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">Booked</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 pl-11">
            <button
              type="button"
              onClick={() => onConvertBooking(booking)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-success hover:bg-success/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Convert to Tenant
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancelBooking(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-coral hover:bg-coral/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Available bed
    if (confirmDeleteBed) {
      return (
        <ConfirmInline
          message={<>Delete Bed <span className="font-semibold">{bed.bed_number}</span>?</>}
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteBed(false)}
          onConfirm={async () => { await onDeleteBed(bed.id); }}
        />
      );
    }
    if (booking_) {
      return <BookBedForm bedNumber={bed.bed_number} onSave={onBook} onCancel={() => setBooking_(false)} />;
    }
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist text-xs font-semibold tabular-nums text-slate2 shrink-0">
          {bed.bed_number}
        </div>
        <span className="text-sm text-slate2 flex-1">Available</span>
        {onAssign && (
          <button
            type="button"
            onClick={() => onAssign(bed.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-ink hover:bg-mist transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign
          </button>
        )}
        <button
          type="button"
          onClick={() => setBooking_(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-amber hover:bg-amber/10 transition-colors"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Book
        </button>
        <StatusBadge status="free" />
        {onDeleteBed && (
          <button
            type="button"
            onClick={() => setConfirmDeleteBed(true)}
            className="ml-1 p-1.5 rounded-lg text-slate2/60 hover:text-coral hover:bg-coral/10 active:text-coral active:bg-coral/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    );
  }

  if (confirming) {
    return (
      <ConfirmInline
        message={<>Vacate <span className="font-semibold">{tenant.name}</span> from Bed {bed.bed_number}?</>}
        confirmLabel="Yes, vacate"
        onCancel={() => setConfirming(false)}
        onConfirm={() => { onVacate(tenant.id); setConfirming(false); }}
      />
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Top row: bed number + name + payment toggle */}
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums shrink-0 ${
          isPaid ? 'bg-success/10 text-success' : 'bg-coral/10 text-coral'
        }`}>
          {bed.bed_number}
        </div>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onViewTenant?.(tenant.id)}
            className="text-sm font-semibold text-ink truncate hover:underline text-left w-full block"
          >
            {tenant.name}
          </button>
          <p className="text-xs text-slate2 tabular-nums truncate">
            {fmt(occ.monthly_rent)}/mo · since {occ.start_date}
          </p>
        </div>

        <PaymentToggleBtn
          isPaid={isPaid}
          onMarkPaid={() => onMarkPaid({ tenantId: tenant.id, name: tenant.name, roomNumber, bedNumber: bed.bed_number, monthlyRent: occ.monthly_rent })}
          onMarkUnpaid={() => onMarkUnpaid(tenant.id)}
        />
      </div>

      {/* Bottom row: secondary actions aligned under name */}
      <div className="flex items-center gap-1 mt-1.5 pl-11">
        <WhatsAppLink
          name={tenant.name}
          phone={tenant.phone}
          roomNumber={roomNumber}
          bedNumber={bed.bed_number}
          rent={occ.monthly_rent}
          label="Remind"
          upiId={upiId}
        />
        <button
          type="button"
          title="Move tenant to another bed"
          onClick={() => setMoving(v => !v)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            moving ? 'bg-ink text-white' : 'text-slate2 hover:text-ink hover:bg-mist'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>Move</span>
        </button>
        <button
          type="button"
          title="Vacate tenant"
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-coral hover:bg-coral/10 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Vacate</span>
        </button>
      </div>

      {moving && (
        <MoveBedForm
          tenant={tenant}
          fromRoomId={roomId}
          rooms={rooms}
          saving={moveSaving}
          onCancel={() => setMoving(false)}
          onConfirm={async (destRoomId, destBedId, destRoomNumber) => {
            setMoveSaving(true);
            try {
              await onMove(tenant.id, destRoomId, destBedId, destRoomNumber, bed.bed_number);
              setMoving(false);
            } finally {
              setMoveSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Room detail panel ────────────────────────────────────────────────────────

function RoomDetail({ room, rooms, selectedPropertyId, organizationId, upiId, onClose, onAssign, onAssignBed, onRoomUpdate, onViewTenant, onDeleteRoom, onConvertBooking }) {
  const toast = useToast();
  const occupied = room.beds.filter(b => b.tenant).length;
  const capacity = room.beds.length;
  const unpaid = room.beds.filter(b => b.occupancy?.payment_status === 'Unpaid').length;
  const revenue = room.beds.reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);
  const pendingAmt = room.beds
    .filter(b => b.occupancy?.payment_status === 'Unpaid')
    .reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);
  const [collectingBed, setCollectingBed] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingRoomNumber, setEditingRoomNumber] = useState(false);
  const [roomNumberDraft, setRoomNumberDraft] = useState(room.room_number);
  const [savingRoomNumber, setSavingRoomNumber] = useState(false);

  async function handleSaveRoomNumber() {
    const val = roomNumberDraft.trim();
    if (!val || val === room.room_number) { setEditingRoomNumber(false); return; }
    setSavingRoomNumber(true);
    try {
      await updateRoomNumber(room.id, val);
      toast.success(`Room renamed to ${val}`);
      onRoomUpdate();
      setEditingRoomNumber(false);
    } catch (e) { toast.error(e.message); }
    finally { setSavingRoomNumber(false); }
  }

  const hasAvailable = room.beds.some(b => !b.tenant);

  function handleMarkPaid(bedInfo) {
    setCollectingBed(bedInfo);
  }

  async function handleConfirmPaid(amountCollected, deductionReason) {
    const { tenantId, name } = collectingBed;
    setCollectingBed(null);
    try {
      const currentYM = new Date().toISOString().slice(0, 7);
      await updateTenant(tenantId, { paymentStatus: 'Paid', paymentDate: new Date().toISOString().slice(0, 10) });
      markTenantRecordPaid(tenantId, currentYM, amountCollected, deductionReason).catch(console.error);
      logActivity(selectedPropertyId, 'payment_paid', `${name} marked paid — Room ${room.room_number}`);
      toast.success(`${name} marked paid`);
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleMarkUnpaid(tenantId) {
    const bed = room.beds.find(b => b.tenant?.id === tenantId);
    try {
      await updateTenant(tenantId, { paymentStatus: 'Unpaid', paymentDate: '' });
      logActivity(selectedPropertyId, 'payment_unpaid', `${bed?.tenant?.name ?? 'Tenant'} marked unpaid — Room ${room.room_number}`);
      toast.info(`${bed?.tenant?.name ?? 'Tenant'} marked unpaid`);
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleDeleteBed(bedId) {
    try {
      await deleteBed(bedId);
      toast.success('Bed removed');
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleBook(bed, { name, phone, advanceAmount, expectedJoinDate }) {
    try {
      await createBooking(selectedPropertyId, organizationId, {
        roomId: room.id,
        bedId: bed.id,
        name, phone, advanceAmount, expectedJoinDate,
      });
      toast.success(`Bed ${bed.bed_number} booked for ${name}`);
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleCancelBooking(bookingId, bedId) {
    try {
      await cancelBooking(bookingId, bedId);
      toast.info('Booking cancelled');
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleVacate(tenantId) {
    const bed = room.beds.find(b => b.tenant?.id === tenantId);
    try {
      await deleteTenant(tenantId);
      logActivity(selectedPropertyId, 'tenant_vacated', `${bed?.tenant?.name ?? 'Tenant'} vacated Room ${room.room_number} Bed ${bed?.bed_number ?? ''}`);
      toast.success(`${bed?.tenant?.name ?? 'Tenant'} vacated`);
      onRoomUpdate();
    } catch (e) { toast.error(e.message); }
  }

  async function handleMove(tenantId, destRoomId, destBedId, destRoomNumber, fromBedNumber) {
    const bed = room.beds.find(b => b.tenant?.id === tenantId);
    await moveTenant(tenantId, { roomId: destRoomId, bedId: destBedId });
    logActivity(selectedPropertyId, 'tenant_moved', `${bed?.tenant?.name ?? 'Tenant'} moved from Room ${room.room_number} Bed ${fromBedNumber} → Room ${destRoomNumber}`);
    onRoomUpdate();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <IconBtn variant="ghost" onClick={onClose} className="sm:hidden">
              <ArrowLeft className="h-4 w-4" />
            </IconBtn>
            {editingRoomNumber ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={roomNumberDraft}
                  onChange={e => setRoomNumberDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveRoomNumber(); if (e.key === 'Escape') setEditingRoomNumber(false); }}
                  className="w-24 rounded-lg border border-border px-2 py-1 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                />
                <IconBtn variant="ghost" onClick={handleSaveRoomNumber} disabled={savingRoomNumber}>
                  {savingRoomNumber ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-leaf" />}
                </IconBtn>
                <IconBtn variant="ghost" onClick={() => setEditingRoomNumber(false)}><X className="h-3.5 w-3.5" /></IconBtn>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <h2 className="font-semibold text-ink text-lg">Room {room.room_number}</h2>
                <IconBtn variant="ghost" onClick={() => { setRoomNumberDraft(room.room_number); setEditingRoomNumber(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Rename room">
                  <Pencil className="h-3.5 w-3.5 text-slate2" />
                </IconBtn>
              </div>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate2 tabular-nums">
            {occupied} occupied · {capacity - occupied} vacant{capacity > 0 ? ` · ${Math.round((occupied / capacity) * 100)}% full` : ''}
            {revenue > 0 && ` · ${fmt(revenue)}/mo`}
            {unpaid > 0 && <> · <span className="text-coral">{fmt(pendingAmt)} pending</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasAvailable && (
            <Btn variant="primary" size="sm" onClick={() => onAssign(room)}>
              <Plus className="h-4 w-4" />
              Assign
            </Btn>
          )}
          {occupied === 0 && (
            confirmDelete ? (
              <ConfirmInline
                message={`Delete Room ${room.room_number}?`}
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={async () => {
                  setDeleting(true);
                  try {
                    await onDeleteRoom(room.id);
                    setConfirmDelete(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setDeleting(false);
                  }
                }}
              />
            ) : (
              <IconBtn variant="ghost" onClick={() => setConfirmDelete(true)} title="Delete room">
                <Trash2 className="h-4 w-4 text-coral" />
              </IconBtn>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border pb-20 sm:pb-0">
        {room.beds.map(bed => (
          <BedRow
            key={bed.id}
            bed={bed}
            roomNumber={room.room_number}
            roomId={room.id}
            rooms={rooms}
            upiId={upiId}
            onMarkPaid={handleMarkPaid}
            onMarkUnpaid={handleMarkUnpaid}
            onVacate={handleVacate}
            onMove={handleMove}
            onViewTenant={onViewTenant}
            onDeleteBed={handleDeleteBed}
            onBook={data => handleBook(bed, data)}
            onCancelBooking={handleCancelBooking}
            onConvertBooking={onConvertBooking}
            onAssign={!bed.tenant && !bed.booking && onAssignBed ? bedId => onAssignBed({ propertyId: selectedPropertyId, roomId: room.id, bedId }) : undefined}
          />
        ))}
      </div>

      {unpaid > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-slate2 mb-2">
            {unpaid} tenant{unpaid > 1 ? 's' : ''} unpaid in this room
          </p>
          <div className="flex flex-col gap-1.5">
            {room.beds
              .filter(b => b.occupancy?.payment_status === 'Unpaid' && b.tenant)
              .map(b => {
                const phone = String(b.tenant.phone).replace(/\D/g, '');
                const msg = `Hi ${b.tenant.name}, rent reminder for Room ${room.room_number} Bed ${b.bed_number}. Monthly rent ${fmt(b.occupancy.monthly_rent)} is unpaid. Please pay at your earliest.`;
                const href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                return (
                  <a
                    key={b.id}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 border border-border bg-white rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist transition-colors"
                  >
                    <svg className="h-4 w-4 text-slate2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>{b.tenant.name.split(' ')[0]}</span>
                    <span className="text-slate2">·</span>
                    <span className="text-xs text-slate2">Bed {b.bed_number}</span>
                    <span className="ml-auto text-xs font-semibold text-coral tabular-nums">{fmt(b.occupancy.monthly_rent)}</span>
                  </a>
                );
              })}
          </div>
        </div>
      )}

      {collectingBed && (
        <CollectModal
          record={{ amount: collectingBed.monthlyRent, name: collectingBed.name, roomNumber: collectingBed.roomNumber, bedNumber: collectingBed.bedNumber }}
          onConfirm={handleConfirmPaid}
          onCancel={() => setCollectingBed(null)}
        />
      )}
    </div>
  );
}

// ─── Add room sheet ───────────────────────────────────────────────────────────

function AddRoomSheet({ onSave, onCancel }) {
  const [roomNumber, setRoomNumber] = useState('');
  const [beds, setBeds] = useState('2');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const inputCls = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomNumber.trim()) { setErr('Room number is required.'); return; }
    const n = parseInt(beds, 10);
    if (!n || n < 1 || n > 20) { setErr('Beds must be 1–20.'); return; }
    setErr('');
    setSaving(true);
    try {
      await onSave({ roomNumber: roomNumber.trim(), beds: n });
    } catch (ex) {
      setErr(ex.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center bg-ink/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink">Add Room</h3>
          <button type="button" onClick={onCancel} className="text-slate2 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        {err && <p className="mb-3 text-sm text-coral">{err}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <Label>Room number</Label>
            <input autoFocus value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="e.g. G1, 101, A2" />
          </label>
          <label className="block">
            <Label>Number of beds</Label>
            <input type="number" min="1" max="20" value={beds} onChange={e => setBeds(e.target.value)} className={`mt-1.5 ${inputCls}`} />
          </label>
          <div className="flex gap-2 pt-1">
            <Btn variant="ghost" className="flex-1 justify-center" onClick={onCancel} {...{ type: 'button' }}>Cancel</Btn>
            <Btn variant="primary" className="flex-1 justify-center" disabled={saving} {...{ type: 'submit' }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Room
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rooms page ───────────────────────────────────────────────────────────────

export default function RoomsPage({ selectedPropertyId, organizationId, upiId, onAssignBed, onViewTenant, onConvertBooking }) {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  async function load() {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
      const data = await fetchRoomsWithOccupants(selectedPropertyId);
      setRooms(data);
      const isMobile = window.innerWidth < 640;
      if (selectedRoom) {
        setSelectedRoom(data.find(r => r.id === selectedRoom.id) ?? null);
      } else if (!isMobile) {
        setSelectedRoom(data[0] ?? null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedRoom(null);
    load();
  }, [selectedPropertyId]);

  const stats = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + r.beds.length, 0);
    const occupied = rooms.reduce((s, r) => s + r.beds.filter(b => b.tenant).length, 0);
    const unpaidRooms = rooms.filter(r => r.beds.some(b => b.occupancy?.payment_status === 'Unpaid')).length;
    return { totalBeds, occupied, unpaidRooms };
  }, [rooms]);

  function handleAssign(room) {
    const availableBed = room.beds.find(b => !b.tenant);
    onAssignBed({ propertyId: selectedPropertyId, roomId: room.id, bedId: availableBed?.id ?? '' });
  }

  async function handleAddRoom({ roomNumber, beds }) {
    try {
      await createRoom(selectedPropertyId, { roomNumber, beds });
      setAddingRoom(false);
      toast.success(`Room ${roomNumber} added`);
      await load();
    } catch (e) { toast.error(e.message); }
  }

  async function handleDeleteRoom(roomId) {
    try {
      await deleteRoom(roomId);
      setSelectedRoom(null);
      toast.success('Room deleted');
      await load();
    } catch (e) { toast.error(e.message); }
  }

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
        {error}
      </div>
    );
  }

  const summaryStrip = (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex-1">
      <StatStrip stats={[
        { label: 'Total rooms',     value: rooms.length,                          color: 'text-ink' },
        { label: 'Occupancy',       value: `${Math.round((stats.occupied / (stats.totalBeds || 1)) * 100)}%` },
        { label: 'Vacant beds',     value: stats.totalBeds - stats.occupied,      color: (stats.totalBeds - stats.occupied) > 0 ? 'text-amber' : 'text-success' },
        { label: 'Rooms Pending', value: stats.unpaidRooms,                     color: stats.unpaidRooms > 0 ? 'text-coral' : 'text-success' },
      ]} />
      </div>
      <Btn variant="ghost" className="shrink-0 mt-0.5" onClick={() => setAddingRoom(true)}>
        <Plus className="h-4 w-4" />
        Add Room
      </Btn>
    </div>
  );

  const isMobile = window.innerWidth < 640;

  if (selectedRoom && isMobile) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <Card className="flex-1 rounded-xl overflow-hidden">
          <RoomDetail
            room={selectedRoom}
            rooms={rooms}
            selectedPropertyId={selectedPropertyId}
            organizationId={organizationId}
            upiId={upiId}
            onClose={() => setSelectedRoom(null)}
            onAssign={handleAssign}
            onAssignBed={onAssignBed}
            onRoomUpdate={load}
            onDeleteRoom={handleDeleteRoom}
            onViewTenant={onViewTenant}
            onConvertBooking={onConvertBooking}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {summaryStrip}

      <div className="hidden sm:grid sm:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-4">
        <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {rooms.length === 0 ? (
            <Card><EmptyState icon={BedDouble} title="No rooms yet" body="Tap 'Add Room' above to set up your first room and beds." /></Card>
          ) : rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoom?.id === room.id}
              onClick={() => setSelectedRoom(room)}
            />
          ))}
        </div>

        <Card className="overflow-hidden max-h-[calc(100vh-220px)] flex flex-col">
          {selectedRoom ? (
            <RoomDetail
              room={selectedRoom}
              rooms={rooms}
              selectedPropertyId={selectedPropertyId}
              organizationId={organizationId}
              upiId={upiId}
              onClose={() => setSelectedRoom(null)}
              onAssign={handleAssign}
              onAssignBed={onAssignBed}
              onRoomUpdate={load}
              onDeleteRoom={handleDeleteRoom}
              onViewTenant={onViewTenant}
              onConvertBooking={onConvertBooking}
            />
          ) : (
            <EmptyState
              icon={BedDouble}
              title="Select a room"
              body="Choose a room from the list to view bed details."
            />
          )}
        </Card>
      </div>

      <div className="sm:hidden flex flex-col gap-2">
        {rooms.length === 0 ? (
          <Card>
            <EmptyState icon={BedDouble} title="No rooms yet" body="Tap 'Add Room' above to set up your first room and beds." />
          </Card>
        ) : rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={false}
            onClick={() => setSelectedRoom(room)}
          />
        ))}
      </div>

      {addingRoom && (
        <AddRoomSheet
          onSave={handleAddRoom}
          onCancel={() => setAddingRoom(false)}
        />
      )}
    </div>
  );
}
