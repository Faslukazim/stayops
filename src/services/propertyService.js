import { supabase } from '../lib/supabase';

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, total_beds, address, status, is_demo')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchRoomsWithBeds(propertyId) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      capacity,
      status,
      beds (
        id,
        bed_number,
        status
      )
    `)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .order('room_number');
  if (error) throw error;
  return data;
}

export async function fetchRoomsWithOccupants(propertyId) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      capacity,
      status,
      beds (
        id,
        bed_number,
        status,
        occupancies (
          id,
          monthly_rent,
          payment_status,
          payment_date,
          start_date,
          status,
          tenant:tenants (
            id,
            name,
            phone,
            status
          )
        )
      )
    `)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .order('room_number');
  if (error) throw error;

  // Sort rooms by floor (G→F→S→T→…) then by numeric part within each floor
  const FLOOR_ORDER = { G: 0, F: 1, S: 2, T: 3, FO: 4 };
  function roomSortKey(rn) {
    const m = String(rn).match(/^([A-Za-z]+)(\d+)$/);
    if (!m) return [99, 0, rn];
    const floor = m[1].toUpperCase();
    const num = parseInt(m[2], 10);
    const pri = FLOOR_ORDER[floor] ?? 50 + floor.charCodeAt(0);
    return [pri, num];
  }
  data.sort((a, b) => {
    const [ap, an] = roomSortKey(a.room_number);
    const [bp, bn] = roomSortKey(b.room_number);
    return ap !== bp ? ap - bp : an - bn;
  });

  // Normalize: attach active occupancy directly to each bed
  return data.map(room => ({
    ...room,
    beds: room.beds
      .sort((a, b) => Number(a.bed_number) - Number(b.bed_number))
      .map(bed => {
        const activeOcc = bed.occupancies?.find(
          o => o.status === 'active' && o.tenant?.status === 'active'
        );
        return {
          ...bed,
          occupancy: activeOcc ?? null,
          tenant: activeOcc?.tenant ?? null,
        };
      }),
  }));
}