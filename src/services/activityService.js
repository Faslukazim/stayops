const KEY = 'stayops_activity';
const MAX = 50;

export function logActivity(propertyId, type, description) {
  if (!propertyId) return;
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    const entry = {
      id: crypto.randomUUID(),
      propertyId,
      type,
      description,
      at: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, MAX)));
  } catch (_) {}
}

export function fetchRecentActivity(propertyId, limit = 15) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '[]');
    return (propertyId ? all.filter(e => e.propertyId === propertyId) : all).slice(0, limit);
  } catch (_) {
    return [];
  }
}
