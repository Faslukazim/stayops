import { supabase } from '../lib/supabase';

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, total_beds, address, status, is_demo, upi_id, organization_id')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data;
}

export async function updatePropertyName(propertyId, name) {
  const { error } = await supabase
    .from('properties')
    .update({ name: name.trim() })
    .eq('id', propertyId);
  if (error) throw error;
}

export async function updateRoomNumber(roomId, roomNumber) {
  const { error } = await supabase
    .from('rooms')
    .update({ room_number: roomNumber.trim() })
    .eq('id', roomId);
  if (error) throw error;
}

export async function deleteProperty(propertyId) {
  const { error } = await supabase
    .from('properties')
    .update({ status: 'inactive' })
    .eq('id', propertyId);
  if (error) throw error;
}

export async function createProperty(organizationId, name) {
  const { data, error } = await supabase
    .from('properties')
    .insert({ name: name.trim(), organization_id: organizationId, status: 'active' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createRoom(propertyId, { roomNumber, beds }) {
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert({ property_id: propertyId, room_number: roomNumber, capacity: beds, status: 'active' })
    .select()
    .single();
  if (roomErr) {
    if (roomErr.code === '23505') throw new Error(`Room "${roomNumber}" already exists in this property.`);
    throw roomErr;
  }

  const bedRows = Array.from({ length: beds }, (_, i) => ({
    room_id: room.id,
    bed_number: String(i + 1),
    status: 'available',
  }));
  const { data: createdBeds, error: bedErr } = await supabase.from('beds').insert(bedRows).select();
  if (bedErr) throw bedErr;
  return { ...room, beds: createdBeds };
}

export async function deleteRoom(roomId) {
  const { error } = await supabase.from('rooms').update({ status: 'inactive' }).eq('id', roomId);
  if (error) throw error;
}

export async function deleteBed(bedId) {
  const { error } = await supabase.from('beds').delete().eq('id', bedId);
  if (error) throw error;
}

export async function updatePropertyUpiId(propertyId, upiId) {
  const { error } = await supabase
    .from('properties')
    .update({ upi_id: upiId || null })
    .eq('id', propertyId);
  if (error) throw error;
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
    const s = String(rn);
    const asNum = parseInt(s, 10);
    if (!isNaN(asNum) && String(asNum) === s) return [98, asNum, 0];
    const m = s.match(/^([A-Za-z]+)(\d+)$/);
    if (!m) return [99, 0, s];
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

  // Fetch pending bookings for this property to attach to reserved beds
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'pending');
  const bookingByBed = Object.fromEntries((bookings ?? []).map(b => [b.bed_id, b]));

  // Normalize: attach active occupancy + booking directly to each bed
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
          booking: bookingByBed[bed.id] ?? null,
        };
      }),
  }));
}