import { supabase } from '../lib/supabase';

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, total_beds, address, status')
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