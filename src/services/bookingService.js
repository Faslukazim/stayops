import { supabase, hasSupabaseConfig } from '../lib/supabase';

export async function fetchBookings(propertyId) {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBooking(propertyId, _organizationId, { roomId, bedId, name, phone, advanceAmount, expectedJoinDate }) {
  if (!hasSupabaseConfig) return null;

  // Always resolve org from the property to avoid null org_id RLS failures
  const { data: prop, error: propErr } = await supabase
    .from('properties')
    .select('organization_id')
    .eq('id', propertyId)
    .single();
  if (propErr) throw propErr;

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      property_id: propertyId,
      organization_id: prop.organization_id,
      room_id: roomId,
      bed_id: bedId,
      name,
      phone: phone || '',
      advance_amount: advanceAmount || 0,
      expected_join_date: expectedJoinDate || null,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('beds').update({ status: 'reserved' }).eq('id', bedId);
  return data;
}

export async function cancelBooking(bookingId, bedId) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (error) throw error;
  await supabase.from('beds').update({ status: 'available' }).eq('id', bedId);
}

export async function convertBooking(bookingId) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase.from('bookings').update({ status: 'converted' }).eq('id', bookingId);
  if (error) throw error;
}
