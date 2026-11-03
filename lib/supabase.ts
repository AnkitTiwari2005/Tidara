import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkhtxqomvxjqnfwvmjnv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raHR4cW9tdnhqcW5md3Ztam52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjI4NDMsImV4cCI6MjEwODg5ODg0M30.10tajWbgcvwzfXeJxBydA8eie5hR7pfjliEfyrxM4Js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  last_name?: string | null;
  email?: string | null;
  wallet_balance?: number;
  push_token?: string | null;
  created_at?: string;
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { phone: string; first_name: string }) {
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const payload: any = {
      ...profile,
      phone: canonicalPhone,
    };

    // If id is missing, empty, or not a valid UUID (e.g. client Date.now() timestamp), omit it
    // so Postgres's default gen_random_uuid() safely generates a real UUID.
    if (!payload.id || !UUID_REGEX.test(payload.id)) {
      delete payload.id;
    }

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
    const payload: any = { ...updates };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const { data, error } = await supabase
      .from('users')
      .update(payload)
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
    // Call server-side SECURITY DEFINER RPC to ensure real deletion bypassing client RLS limits
    const { data, error } = await supabase.rpc('delete_user_account', { p_phone: canonicalPhone });
    if (error) {
      // Fallback direct delete for backwards compatibility
      await supabase.from('addresses').delete().eq('user_phone', canonicalPhone);
      await supabase.from('bookings').delete().eq('user_phone', canonicalPhone);
      const { error: userErr } = await supabase.from('users').delete().eq('phone', canonicalPhone);
      return { success: !userErr, error: userErr };
    }
    return { success: data?.success ?? true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function debitWallet(phone: string, amount: number, description?: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase.rpc('debit_wallet', {
      p_phone: canonicalPhone,
      p_amount: Math.round(amount),
      p_description: description || 'Service Booking Payment',
    });
    if (error) return { success: false, error };
    return { success: data?.success ?? false, remaining: data?.remaining, error: data?.error };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function creditWallet(phone: string, amount: number, bonus: number, description?: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase.rpc('credit_wallet', {
      p_phone: canonicalPhone,
      p_amount: Math.round(amount),
      p_bonus: Math.round(bonus),
      p_description: description || 'Wallet Top-up',
    });
    if (error) return { success: false, error };
    return { success: data?.success ?? false, balance: data?.balance, error: data?.error };
  } catch (err: any) {
    return { success: false, error: err?.message };
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
  slot_label?: string;
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

export async function cancelBooking(id: string, userPhone?: string) {
  try {
    let query = supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (userPhone) {
      query = query.eq('user_phone', normalizePhone(userPhone));
    }
    const { data, error } = await query.select();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ----------------------------------------------------
// Saved Addresses
// ----------------------------------------------------

export interface SavedAddress {
  id?: string;
  user_phone: string;
  address_type?: string;
  flat_no?: string;
  landmark?: string;
  full_address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export async function getUserAddresses(phone: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_phone', canonicalPhone)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function saveUserAddress(address: SavedAddress) {
  try {
    const canonicalPhone = normalizePhone(address.user_phone);
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...address,
        user_phone: canonicalPhone,
      })
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
