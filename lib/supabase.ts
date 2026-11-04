import { createClient } from '@supabase/supabase-js';
import { useAppStore } from '../store/useAppStore';

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

/**
 * Retrieve authorization headers with the server-minted session token (X1).
 * Zero client-side secrets: runs safely on React Native Hermes without crypto polyfills (X5).
 */
function getAuthHeaders(): Record<string, string> {
  const token = useAppStore.getState()?.authToken || '';
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Tidara-Token': token,
  };
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

/**
 * Creates a new user row (INSERT only, no upsert).
 * This is used only for new-user sign-up. Never includes wallet_balance.
 */
export async function insertUserProfile(
  profile: Pick<UserProfile, 'phone' | 'first_name'> &
    Partial<Pick<UserProfile, 'last_name' | 'email' | 'push_token' | 'id'>>
) {
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const insertPayload: Record<string, any> = {
      phone: canonicalPhone,
      first_name: profile.first_name,
    };
    if (profile.last_name !== undefined) insertPayload.last_name = profile.last_name;
    if (profile.email !== undefined) insertPayload.email = profile.email;
    if (profile.push_token !== undefined) insertPayload.push_token = profile.push_token;
    if (profile.id && UUID_REGEX.test(profile.id)) {
      insertPayload.id = profile.id;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Updates allowed columns on an existing user row (UPDATE only).
 * Never touches phone or wallet_balance.
 */
export async function updateUserProfile(
  phone: string,
  updates: Partial<Omit<UserProfile, 'phone' | 'wallet_balance' | 'id' | 'created_at'>>
) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const safeUpdates: Record<string, any> = { ...updates };
    delete safeUpdates.phone;
    delete safeUpdates.wallet_balance;
    delete safeUpdates.id;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('phone', canonicalPhone)
      .select()
      .maybeSingle();

    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Safe upsert that never includes phone in an ON CONFLICT DO UPDATE SET list (W4).
 */
export async function upsertUserProfile(profile: Partial<UserProfile> & { phone: string }) {
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const updatePayload: Record<string, any> = {};
    if (profile.first_name !== undefined) updatePayload.first_name = profile.first_name;
    if (profile.last_name !== undefined) updatePayload.last_name = profile.last_name;
    if (profile.email !== undefined) updatePayload.email = profile.email;
    if (profile.push_token !== undefined) updatePayload.push_token = profile.push_token;

    // Try UPDATE first
    const { data: updatedData, error: updateErr } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('phone', canonicalPhone)
      .select()
      .maybeSingle();

    if (updatedData) {
      return { data: updatedData, error: null };
    }

    // No existing row found — INSERT as new user
    return await insertUserProfile({
      phone: canonicalPhone,
      first_name: profile.first_name || 'User',
      last_name: profile.last_name ?? undefined,
      email: profile.email ?? undefined,
      id: profile.id,
    });
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
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteUserAccount(phone: string): Promise<{ success: boolean; error: any }> {
  try {
    const canonicalPhone = normalizePhone(phone);
    if (!canonicalPhone) {
      return { success: false, error: new Error('Invalid phone number') };
    }

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: { action: 'delete-account' },
      headers: getAuthHeaders(),
    });

    if (edgeErr) {
      return { success: false, error: edgeErr };
    }

    const isSuccess = edgeData?.success === true && (edgeData?.deleted_rows ?? 0) > 0;
    return {
      success: isSuccess,
      error: isSuccess ? null : new Error(edgeData?.message || edgeData?.error || 'Account not found or no records deleted'),
    };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function debitWallet(
  phone: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; remaining?: number; error?: any }> {
  try {
    const canonicalPhone = normalizePhone(phone);
    if (!canonicalPhone || amount <= 0) {
      return { success: false, error: 'Valid phone and positive amount are required' };
    }

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: {
        action: 'debit-wallet',
        amount: Math.round(amount),
        description: description || 'Service Booking Payment',
      },
      headers: getAuthHeaders(),
    });

    if (edgeErr) {
      return { success: false, error: edgeErr.message };
    }

    return {
      success: edgeData?.success === true,
      remaining: edgeData?.remaining,
      error: edgeData?.success === false ? (edgeData?.error || edgeData?.message) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Top-up credit: verified strictly through captured Razorpay payment (W2, X1, X2, X6).
 * Client bonus and arbitrary unverified credits are rejected.
 */
export async function creditWallet(
  phone: string,
  amount: number,
  bonus: number,
  description?: string,
  paymentId?: string
): Promise<{ success: boolean; balance?: number; error?: any }> {
  try {
    const canonicalPhone = normalizePhone(phone);
    if (!canonicalPhone || amount <= 0) {
      return { success: false, error: 'Valid phone and positive amount are required' };
    }

    if (!paymentId) {
      return { success: false, error: 'Valid paymentId required. Arbitrary credits are not permitted.' };
    }

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: {
        action: 'verify-and-credit',
        paymentId,
      },
      headers: getAuthHeaders(),
    });

    if (edgeErr) {
      return { success: false, error: edgeErr.message };
    }

    return {
      success: edgeData?.success === true,
      balance: edgeData?.balance,
      error: edgeData?.success === false ? (edgeData?.error || edgeData?.message) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Atomic Wallet Booking Transaction (X2).
 * Deducts wallet balance and inserts all booking rows in a single atomic DB transaction.
 * Eliminates client-side rollbacks entirely.
 */
export async function bookWithWallet(
  total: number,
  items: Array<{
    service_id: string;
    service_name: string;
    price: number;
    quantity: number;
    duration: string;
    slot_label: string;
    scheduled_at: string;
    address: string;
  }>
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    if (total <= 0 || !items || items.length === 0) {
      return { success: false, error: 'Valid total and items required' };
    }

    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: {
        action: 'wallet-booking',
        total: Math.round(total),
        items,
      },
      headers: getAuthHeaders(),
    });

    if (edgeErr) {
      return { success: false, error: edgeErr.message || 'Wallet booking request failed' };
    }

    return {
      success: edgeData?.success === true,
      remaining: edgeData?.remaining,
      error: edgeData?.success === false ? (edgeData?.error || edgeData?.message) : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Wallet booking failed' };
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
    return { data: null, error: err };
  }
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>) {
  try {
    const canonicalPhone = normalizePhone(booking.user_phone);
    const payload = {
      ...booking,
      user_phone: canonicalPhone,
    };
    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function cancelBooking(id: string, userPhone: string): Promise<{ success: boolean; error: any }> {
  try {
    if (!id || !userPhone) {
      return { success: false, error: new Error('Booking ID and Phone are required') };
    }
    const canonicalPhone = normalizePhone(userPhone);

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_phone', canonicalPhone)
      .eq('status', 'upcoming')
      .select();

    if (error) {
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      return { success: false, error: new Error('Booking not found or not in upcoming status') };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

// ----------------------------------------------------
// Addresses
// ----------------------------------------------------

export interface UserAddress {
  id?: string;
  user_phone: string;
  type: string;
  address_line: string;
  landmark?: string | null;
  city: string;
  is_default: boolean;
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
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

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

export const addUserAddress = saveUserAddress;

export async function deleteUserAddress(id: string) {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ----------------------------------------------------
// Wallet Ledger
// ----------------------------------------------------

export interface WalletTransaction {
  id: string;
  user_phone: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export async function getWalletTransactions(phone: string) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_phone', canonicalPhone)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
