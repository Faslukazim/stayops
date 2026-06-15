import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, BedDouble, CheckCircle2, Loader2,
  MessageCircle, Plus, Trash2, X,
} from 'lucide-react';
import { fetchRoomsWithOccupants } from './services/propertyService';
import { deleteTenant, updateTenant } from './services/tenantService';

function fmt(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function waLink(name, phone, roomNumber, bedNumber, rent) {
  const p = String(phone).replace(/\D/g, '');
  const msg = `Hi ${name}, rent reminder for Room ${roomNumber} Bed ${bedNumber}. Monthly rent ${fmt(rent)} is unpaid. Please pay at your earliest.`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}

function Label({ children, className = '' }) {
  return (
    <span className={`text-2xs font-semibold uppercase tracking-widest text-slate2 ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white shadow-card border border-border ${className}`}>
      {children}
    </div>
  );
}

// ─── Occupancy bar ────────────────────────────────────────────────────────────

function OccBar({ occupied, capacity }) {
  const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div
        className="h-full rounded-full bg-leaf transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({ room, isSelected, onClick }) {
  const occupied = room.beds.filter(b => b.tenant).length;
  const capacity = room.beds.length;
  const unpaid = room.beds.filter(
    b => b.occupancy?.payment_status === 'Unpaid'
  ).length;
  const isEmpty = occupied === 0;
  const isFull = occupied === capacity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.98] ${
        isSelected
          ? 'border-ink bg-ink text-white shadow-lift'
          : 'border-border bg-white hover:border-slate2 shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-ink'}`}>
          Room {room.room_number}
        </p>
        {unpaid > 0 && (
          <span className="shrink-0 rounded-full bg-coral/10 px-2 py-0.5 text-2xs font-semibold text-coral">
            {unpaid} unpaid
          </span>
        )}
        {unpaid === 0 && isFull && (
          <span className="shrink-0 rounded-full bg-leaf/10 px-2 py-0.5 text-2xs font-semibold text-leaf">
            All paid
          </span>
        )}
        {isEmpty && (
          <span className="shrink-0 rounded-full bg-amber/10 px-2 py-0.5 text-2xs font-semibold text-amber">
            Empty
          </span>
        )}
      </div>

      <p className={`mt-1 text-xs ${isSelected ? 'text-white/70' : 'text-slate2'}`}>
        {occupied}/{capacity} beds occupied
      </p>

      <OccBar occupied={occupied} capacity={capacity} />

      {occupied > 0 && (
        <p className={`mt-2 text-xs truncate ${isSelected ? 'text-white/60' : 'text-slate2'}`}>
          {room.beds
            .filter(b => b.tenant)
            .map(b => b.tenant.name.split(' ')[0])
            .join(' · ')}
        </p>
      )}
    </button>
  );
}

// ─── Bed row ──────────────────────────────────────────────────────────────────

function BedRow({ bed, roomNumber, onMarkPaid, onMarkUnpaid, onVacate }) {
  const occ = bed.occupancy;
  const tenant = bed.tenant;
  const isPaid = occ?.payment_status === 'Paid';
  const [confirmVacate, setConfirmVacate] = useState(false);

  if (!tenant) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist text-xs font-bold text-slate2 shrink-0">
          {bed.bed_number}
        </div>
        <span className="text-sm text-slate2">Available</span>
        <span className="ml-auto rounded-full bg-leaf/10 px-2 py-0.5 text-2xs font-semibold text-leaf">
          Free
        </span>
      </div>
    );
  }

  if (confirmVacate) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-coral/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10 text-xs font-bold text-coral shrink-0">
          {bed.bed_number}
        </div>
        <p className="text-sm text-ink flex-1">
          Vacate <span className="font-semibold">{tenant.name}</span> from Bed {bed.bed_number}?
        </p>
        <button
          type="button"
          onClick={() => setConfirmVacate(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate2 hover:bg-mist"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { onVacate(tenant.id); setConfirmVacate(false); }}
          className="rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
        >
          Yes, vacate
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
        isPaid ? 'bg-leaf/10 text-leaf' : 'bg-coral/10 text-coral'
      }`}>
        {bed.bed_number}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{tenant.name}</p>
        <p className="text-xs text-slate2">
          {fmt(occ.monthly_rent)}/mo · since {occ.start_date}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
          isPaid ? 'bg-leaf/10 text-leaf' : 'bg-coral/10 text-coral'
        }`}>
          {isPaid ? 'Paid' : 'Unpaid'}
        </span>

        <button
          type="button"
          onClick={() => isPaid ? onMarkUnpaid(tenant.id) : onMarkPaid(tenant.id)}
          title={isPaid ? 'Mark unpaid' : 'Mark paid'}
          className={`rounded-lg p-1.5 transition-colors ${
            isPaid
              ? 'text-coral hover:bg-coral/10'
              : 'text-leaf hover:bg-leaf/10'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>

        <a
          href={waLink(tenant.name, tenant.phone, roomNumber, bed.bed_number, occ.monthly_rent)}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp reminder"
          className="rounded-lg p-1.5 text-slate2 hover:bg-mist hover:text-ink transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={() => setConfirmVacate(true)}
          title="Vacate"
          className="rounded-lg p-1.5 text-coral hover:bg-coral/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Room detail panel ────────────────────────────────────────────────────────

function RoomDetail({ room, onClose, onAssign, onRoomUpdate }) {
  const [rooms, setRooms] = useState(null);

  const occupied = room.beds.filter(b => b.tenant).length;
  const capacity = room.beds.length;
  const unpaid = room.beds.filter(b => b.occupancy?.payment_status === 'Unpaid').length;
  const revenue = room.beds.reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);
  const pendingAmt = room.beds
    .filter(b => b.occupancy?.payment_status === 'Unpaid')
    .reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);

  async function handleMarkPaid(tenantId) {
    await updateTenant(tenantId, {
      paymentStatus: 'Paid',
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    onRoomUpdate();
  }

  async function handleMarkUnpaid(tenantId) {
    await updateTenant(tenantId, { paymentStatus: 'Unpaid', paymentDate: '' });
    onRoomUpdate();
  }

  async function handleVacate(tenantId) {
    await deleteTenant(tenantId);
    onRoomUpdate();
  }

  const hasAvailable = room.beds.some(b => !b.tenant);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate2 hover:bg-mist hover:text-ink sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="font-bold text-ink text-lg">Room {room.room_number}</h2>
          </div>
          <p className="mt-0.5 text-sm text-slate2">
            {occupied}/{capacity} occupied
            {revenue > 0 && ` · ${fmt(revenue)}/mo`}
            {unpaid > 0 && ` · `}
            {unpaid > 0 && <span className="text-coral">{fmt(pendingAmt)} unpaid</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasAvailable && (
            <button
              type="button"
              onClick={() => onAssign(room)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-leaf px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Assign bed
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex rounded-lg p-1.5 text-slate2 hover:bg-mist hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bed list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {room.beds.map(bed => (
          <BedRow
            key={bed.id}
            bed={bed}
            roomNumber={room.room_number}
            onMarkPaid={handleMarkPaid}
            onMarkUnpaid={handleMarkUnpaid}
            onVacate={handleVacate}
          />
        ))}
      </div>

      {/* Remind all unpaid */}
      {unpaid > 0 && (
        <div className="border-t border-border p-3">
          <p className="text-xs text-slate2 mb-2">
            {unpaid} tenant{unpaid > 1 ? 's' : ''} unpaid in this room
          </p>
          <div className="flex flex-col gap-1.5">
            {room.beds
              .filter(b => b.occupancy?.payment_status === 'Unpaid' && b.tenant)
              .map(b => (
                <a
                  key={b.id}
                  href={waLink(b.tenant.name, b.tenant.phone, room.room_number, b.bed_number, b.occupancy.monthly_rent)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-slate2 hover:text-ink hover:bg-mist transition-colors"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Remind {b.tenant.name.split(' ')[0]} (Bed {b.bed_number})
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rooms page ───────────────────────────────────────────────────────────────

export default function RoomsPage({ selectedPropertyId, onAssignBed }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
      const data = await fetchRoomsWithOccupants(selectedPropertyId);
      setRooms(data);
      // Refresh selected room data if one is open
      if (selectedRoom) {
        const refreshed = data.find(r => r.id === selectedRoom.id);
        setSelectedRoom(refreshed ?? null);
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
    const emptyRooms = rooms.filter(r => r.beds.every(b => !b.tenant)).length;
    const unpaidRooms = rooms.filter(r => r.beds.some(b => b.occupancy?.payment_status === 'Unpaid')).length;
    return { totalBeds, occupied, emptyRooms, unpaidRooms };
  }, [rooms]);

  function handleAssign(room) {
    // Find first available bed in room
    const availableBed = room.beds.find(b => !b.tenant);
    onAssignBed({
      propertyId: selectedPropertyId,
      roomId: room.id,
      bedId: availableBed?.id ?? '',
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
        {error}
      </div>
    );
  }

  // Summary strip
  const summaryStrip = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
      {[
        { label: 'Total rooms', value: rooms.length, color: 'text-ink' },
        { label: 'Occupied beds', value: `${stats.occupied}/${stats.totalBeds}`, color: 'text-leaf' },
        { label: 'Empty rooms', value: stats.emptyRooms, color: stats.emptyRooms > 0 ? 'text-amber' : 'text-leaf' },
        { label: 'Rooms w/ unpaid', value: stats.unpaidRooms, color: stats.unpaidRooms > 0 ? 'text-coral' : 'text-leaf' },
      ].map(s => (
        <Card key={s.label} className="p-4">
          <Label>{s.label}</Label>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
        </Card>
      ))}
    </div>
  );

  // Mobile: show detail screen if room selected
  if (selectedRoom) {
    return (
      <div className="sm:hidden flex flex-col min-h-screen -mt-4 -mx-4">
        {summaryStrip && null}
        <Card className="flex-1 rounded-none border-0">
          <RoomDetail
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onAssign={handleAssign}
            onRoomUpdate={load}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {summaryStrip}

      {/* Desktop: two-column layout */}
      <div className="hidden sm:grid sm:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-4">
        {/* Room list */}
        <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoom?.id === room.id}
              onClick={() => setSelectedRoom(room)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <Card className="overflow-hidden max-h-[calc(100vh-220px)] flex flex-col">
          {selectedRoom ? (
            <RoomDetail
              room={selectedRoom}
              onClose={() => setSelectedRoom(null)}
              onAssign={handleAssign}
              onRoomUpdate={load}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate2 p-8">
              <BedDouble className="h-8 w-8 opacity-30" />
              <p className="text-sm">Select a room to see bed details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile: room cards list */}
      <div className="sm:hidden flex flex-col gap-2">
        {rooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            isSelected={false}
            onClick={() => setSelectedRoom(room)}
          />
        ))}
      </div>
    </div>
  );
}