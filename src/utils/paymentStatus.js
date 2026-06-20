// Single source of truth for all payment status calculations.
// Used by FinancePage (payment_records) and Dashboard (tenant objects).
// Both use identical rules so counts always match.
//
// Core design: status is derived from (dueDay, today, viewYM, record.status) only.
// join_date / daysSinceJoin are NOT used — those are move-in concepts, not billing concepts.

export const STATUS = {
  PAID:     'paid',
  DUE_SOON: 'due_soon',
  DUE_TODAY:'due_today',
  OVERDUE:  'overdue',
  UPCOMING: 'upcoming',
};

// Parse YYYY-MM-DD without UTC timezone issues
function parseYMD(str) {
  if (!str) return null;
  const s = String(str).slice(0, 10);
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return { year: y, month: m, day: d };
}

function ymStr(d) {
  return `${d.year}-${String(d.month).padStart(2, '0')}`;
}

function todayLocal() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}

/**
 * Compute display status for a payment_record row.
 * record must have: { status, dueDay }
 * dueDay comes from occupancies.rent_due_day — not from join_date.
 * viewYM: YYYY-MM of the month being displayed.
 */
export function computeRecordStatus(record, viewYM) {
  if (record.status === 'paid') return STATUS.PAID;

  const today = todayLocal();
  const todayYM = ymStr(today);

  if (viewYM < todayYM) return STATUS.OVERDUE;  // past month, not paid
  if (viewYM > todayYM) return STATUS.UPCOMING; // future month

  // Current month — pure due-date arithmetic, no join_date involved
  const dueDay = record.dueDay ?? 1;
  if (today.day > dueDay)      return STATUS.OVERDUE;
  if (today.day === dueDay)    return STATUS.DUE_TODAY;
  if (today.day >= dueDay - 3) return STATUS.DUE_SOON;
  return STATUS.UPCOMING;
}

/** How many days overdue for a record. Returns 0 if not overdue. */
export function recordDaysOverdue(record, viewYM) {
  const today = todayLocal();
  const todayYM = ymStr(today);
  if (record.status === 'paid') return 0;
  if (viewYM < todayYM) {
    const [y, m] = viewYM.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const endOfMonth = new Date(y, m - 1, lastDay);
    const now = new Date(today.year, today.month - 1, today.day);
    return Math.round((now - endOfMonth) / 86400000);
  }
  if (viewYM === todayYM) {
    const diff = today.day - (record.dueDay ?? 1);
    return diff > 0 ? diff : 0;
  }
  return 0;
}

/** Days until this record's due date. Returns 0 if due today or past. */
export function recordDaysUntilDue(record) {
  const today = todayLocal();
  return Math.max(0, (record.dueDay ?? 1) - today.day);
}

/**
 * Compute display status from a tenant object (Dashboard / Tenants page).
 * Uses tenant.rentDueDay — the explicit billing day, not derived from joinDate.
 * Falls back to joinDate day only if rentDueDay is absent (localStorage / old data).
 */
export function computeTenantStatus(tenant) {
  const today = todayLocal();
  const todayYM = ymStr(today);

  // Paid this billing cycle = marked Paid AND paymentDate is in current month
  const payDate = parseYMD(tenant.paymentDate);
  if (tenant.paymentStatus === 'Paid' && payDate && ymStr(payDate) === todayYM) {
    return STATUS.PAID;
  }

  // rentDueDay is the explicit field; fall back to joinDate day for old data
  const dueDay = tenant.rentDueDay
    ?? (tenant.joinDate ? Number(tenant.joinDate.slice(8, 10)) : 1);

  if (today.day > dueDay)      return STATUS.OVERDUE;
  if (today.day === dueDay)    return STATUS.DUE_TODAY;
  if (today.day >= dueDay - 3) return STATUS.DUE_SOON;
  return STATUS.UPCOMING;
}

/** Days overdue for a tenant. Returns 0 if not overdue. */
export function tenantDaysOverdue(tenant) {
  const dueDay = tenant.rentDueDay
    ?? (tenant.joinDate ? Number(tenant.joinDate.slice(8, 10)) : 1);
  const today = todayLocal();
  const diff = today.day - dueDay;
  return diff > 0 ? diff : 0;
}
