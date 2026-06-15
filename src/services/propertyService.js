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