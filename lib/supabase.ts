import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkhtxqomvxjqnfwvmjnv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raHR4cW9tdnhqcW5md3Ztam52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjI4NDMsImV4cCI6MjEwODg5ODg0M30.10tajWbgcvwzfXeJxBydA8eie5hR7pfjliEfyrxM4Js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------------------------------------
// User Profile
// ----------------------------------------------------

export interface UserProfile {
  id: string;
  phone: string;
  first_name: string;
  last_name?: string;
  email?: string;
  wallet_balance: number;
  created_at?: string;
}

export async function upsertUserProfile(profile: Omit<UserProfile, 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(profile, { onConflict: 'phone' })
      .select()
      .single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getUserByPhone(phone: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
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
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('phone', phone)
      .select()
      .single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
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
  created_at?: string;
}

export async function getUserBookings(phone: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
