import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkhtxqomvxjqnfwvmjnv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raHR4cW9tdnhqcW5md3Ztam52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjI4NDMsImV4cCI6MjEwODg5ODg0M30.10tajWbgcvwzfXeJxBydA8eie5hR7pfjliEfyrxM4Js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/**
 * Standardises phone numbers to canonical E.164 (+91XXXXXXXXXX) format
 * across all database tables and queries.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length === 10) {
    return `+91${last10}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// ----------------------------------------------------
// User Profile
// ----------------------------------------------------

export interface UserProfile {
  id: string;
  phone: string;
  first_name: string;
  last_name?: string;
  email?: string;
  wallet_balance?: number;
  created_at?: string;
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { phone: string; first_name: string }) {
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const payload: any = {
      ...profile,
      phone: canonicalPhone,
    };
    // Ensure we don't accidentally send undefined properties as literal undefined
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'phone' })
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getUserByPhone(phone: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', canonicalPhone)
      .maybeSingle(); // maybeSingle returns null without throwing PGRST116 for new users
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateUserProfile(
  phone: string,
  updates: Partial<UserProfile>
) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('phone', canonicalPhone)
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteUserAccount(phone: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    // Delete user's bookings first
    await supabase.from('bookings').delete().eq('user_phone', canonicalPhone);
    // Delete user row
    const { error } = await supabase.from('users').delete().eq('phone', canonicalPhone);
    return { success: !error, error };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// ----------------------------------------------------
// Bookings
// ----------------------------------------------------

export interface Booking {
  id?: string;
  user_phone: string;
  service_id: string;
  service_name: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  scheduled_at: string;
  address: string;
  payment_id?: string;
  order_id?: string;
  payment_method?: string;
  quantity?: number;
  duration?: string;
  created_at?: string;
}

export async function getUserBookings(phone: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_phone', canonicalPhone)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>) {
  try {
    const canonicalPhone = normalizePhone(booking.user_phone);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...booking,
        user_phone: canonicalPhone,
      })
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function cancelBooking(id: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
