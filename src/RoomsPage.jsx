import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, BedDouble, Plus, X } from 'lucide-react';
import { fetchRoomsWithOccupants } from './services/propertyService';
import { deleteTenant, updateTenant } from './services/tenantService';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, PaymentToggleBtn, WhatsAppLink,
  PageLoader, StatCard, ConfirmInline,
} from './components/ui';

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
  const unpaid = room.beds.filter(b => b.occupancy?.payment_status === 'Unpaid').length;
  const isEmpty = occupied === 0;
  const isFull = occupied === capacity;

  const badgeStatus = unpaid > 0 ? 'unpaid'
    : isFull ? 'paid'
    : isEmpty ? 'empty'
    : null;

  const badgeLabel = unpaid > 0 ? `${unpaid} unpaid`
    : isFull ? 'All paid'
    : isEmpty ? 'Empty'
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.98] ${
       isSelected
  ?'border-leaf bg-emerald-50 shadow-lift ring-2 ring-leaf/30'
          : 'border-border bg-white hover:border-slate2 shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
  <div>
    <p className="font-bold text-base text-ink">
      Room {room.room_number}
    </p>

    {isSelected && (
      <span className="text-[10px] font-semibold uppercase tracking-wide text-leaf">
        Selected
      </span>
    )}
  </div>

  {badgeStatus && (
    <StatusBadge
      status={badgeStatus}
      label={badgeLabel}
    />
  )}
</div>

      <p className={`mt-1 text-xs ${isSelected ? 'text-slate2' : 'text-slate2'}`}>
  {occupied} Occupied • {capacity - occupied} Vacant
</p>

<OccBar occupied={occupied} capacity={capacity} />

<div className="mt-3 flex gap-2">
  {Array.from({ length: capacity }).map((_, i) => (
    <div
      key={i}
      className={`h-4 w-4 rounded ${
  i < occupied
    ? 'bg-leaf'
    : isSelected
      ? 'bg-leaf/30 border border-leaf'
      : 'bg-border'
}`}
    />
  ))}
</div>
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
  const [confirming, setConfirming] = useState(false);

  if (!tenant) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist text-xs font-bold tabular-nums text-slate2 shrink-0">
          {bed.bed_number}
        </div>
        <span className="text-sm text-slate2 flex-1">Available</span>
        <StatusBadge status="free" />
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
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold tabular-nums shrink-0 ${
        isPaid ? 'bg-leaf/10 text-leaf' : 'bg-coral/10 text-coral'
      }`}>
        {bed.bed_number}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{tenant.name}</p>
        <p className="text-xs text-slate2 tabular-nums">
          {fmt(occ.monthly_rent)}/mo · since {occ.start_date}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <StatusBadge status={isPaid ? 'paid' : 'unpaid'} />
        <PaymentToggleBtn
          isPaid={isPaid}
          onMarkPaid={() => onMarkPaid(tenant.id)}
          onMarkUnpaid={() => onMarkUnpaid(tenant.id)}
        />
        <WhatsAppLink
          name={tenant.name}
          phone={tenant.phone}
          roomNumber={roomNumber}
          bedNumber={bed.bed_number}
          rent={occ.monthly_rent}
        />
        <IconBtn
          variant="danger"
          title="Vacate"
          onClick={() => setConfirming(true)}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

// ─── Room detail panel ────────────────────────────────────────────────────────

function RoomDetail({ room, onClose, onAssign, onRoomUpdate }) {
  const occupied = room.beds.filter(b => b.tenant).length;
  const capacity = room.beds.length;
  const unpaid = room.beds.filter(b => b.occupancy?.payment_status === 'Unpaid').length;
  const revenue = room.beds.reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);
  const pendingAmt = room.beds
    .filter(b => b.occupancy?.payment_status === 'Unpaid')
    .reduce((s, b) => s + Number(b.occupancy?.monthly_rent || 0), 0);

  const hasAvailable = room.beds.some(b => !b.tenant);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <IconBtn
              variant="ghost"
              onClick={onClose}
              className="sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </IconBtn>
            <h2 className="font-bold text-ink text-lg">Room {room.room_number}</h2>
          </div>
          <p className="mt-0.5 text-sm text-slate2 tabular-nums">
  {occupied} occupied • {capacity - occupied} vacant • {Math.round((occupied / capacity) * 100)}% occupancy
  {revenue > 0 && ` · ${fmt(revenue)}/mo`}
  {unpaid > 0 && (
    <> · <span className="text-coral">{fmt(pendingAmt)} unpaid</span></>
  )}
</p>
        </div>
        <div className="flex items-center gap-2">
          {hasAvailable && (
            <Btn variant="success" size="md" onClick={() => onAssign(room)}
              className="bg-leaf text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Assign bed
            </Btn>
          )}
          
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
                <WhatsAppLink
                  key={b.id}
                  name={b.tenant.name}
                  phone={b.tenant.phone}
                  roomNumber={room.room_number}
                  bedNumber={b.bed_number}
                  rent={b.occupancy.monthly_rent}
                  label={`Remind ${b.tenant.name.split(' ')[0]} (Bed ${b.bed_number})`}
                  className="border border-border justify-start hover:bg-mist rounded-lg px-3 py-2"
                />
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

    // const isMobile = window.innerWidth < 640;

const isMobile = window.innerWidth < 640;

if (selectedRoom) {
  const refreshed = data.find(r => r.id === selectedRoom.id);
  setSelectedRoom(refreshed ?? null);
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
    const emptyRooms = rooms.filter(r => r.beds.every(b => !b.tenant)).length;
    const unpaidRooms = rooms.filter(r => r.beds.some(b => b.occupancy?.payment_status === 'Unpaid')).length;
    return { totalBeds, occupied, emptyRooms, unpaidRooms };
  }, [rooms]);

  function handleAssign(room) {
    const availableBed = room.beds.find(b => !b.tenant);
    onAssignBed({
      propertyId: selectedPropertyId,
      roomId: room.id,
      bedId: availableBed?.id ?? '',
    });
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
      <StatCard label="Total rooms"     value={rooms.length}        color="text-ink" />
      <StatCard label="Occupancy"
value={`${Math.round((stats.occupied / stats.totalBeds) * 100)}%`} />
<StatCard
  label="Vacant beds"
  value={stats.totalBeds - stats.occupied}
  color={(stats.totalBeds - stats.occupied) > 0 ? 'text-amber' : 'text-leaf'}
/>      <StatCard label="Rooms w/ unpaid" value={stats.unpaidRooms}   color={stats.unpaidRooms > 0 ? 'text-coral' : 'text-leaf'} />
    </div>
  );

 const isMobile = window.innerWidth < 640;

// Mobile: full-screen detail view
if (selectedRoom && isMobile) {
    return (
      <div className="sm:hidden flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <Card className="flex-1 rounded-xl overflow-hidden">
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

      {/* Desktop: two-column */}
      <div className="hidden sm:grid sm:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-4">
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
            </div>
          )}
        </Card>
      </div>

      {/* Mobile: room list */}
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