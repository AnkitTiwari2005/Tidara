import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkhtxqomvxjqnfwvmjnv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raHR4cW9tdnhqcW5md3Ztam52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjI4NDMsImV4cCI6MjEwODg5ODg0M30.10tajWbgcvwzfXeJxBydA8eie5hR7pfjliEfyrxM4Js';

// TIDARA_SESSION_SECRET: a 32-byte hex value embedded at build time.
// Generate once: node -e "require('crypto').randomBytes(32).toString('hex')|cl"
// Set identically in Supabase Secrets as TIDARA_SESSION_SECRET.
const SESSION_SECRET = '382a026014863ffe311d8413799c04f3b418de244673310e4202f6fb7228f1f5';

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
 * Build the X-Tidara-Phone header value: "phone:HMAC_HEX"
 * The Edge Function verifies this to ensure the caller owns the phone in the request (W1).
 */
async function buildSessionHeader(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SESSION_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(phone));
  const sigHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${phone}:${sigHex}`;
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
 * Fixes W4: upsert was broken by column-level grant restrictions on phone.
 */
export async function insertUserProfile(
  profile: { phone: string; first_name: string; last_name?: string; email?: string; id?: string }
) {
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const payload: any = {
      phone: canonicalPhone,
      first_name: profile.first_name,
    };
    if (profile.last_name) payload.last_name = profile.last_name;
    if (profile.email) payload.email = profile.email;
    // Only include id if it is a valid UUID (server generates uuid if omitted)
    if (profile.id && UUID_REGEX.test(profile.id)) {
      payload.id = profile.id;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .maybeSingle();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Updates an existing user's profile columns (never phone or wallet_balance).
 * Used for profile edits and push token sync.
 * Fixes W4: by never sending phone in the UPDATE payload.
 */
export async function updateUserProfile(
  phone: string,
  updates: Partial<UserProfile>
) {
  try {
    const canonicalPhone = normalizePhone(phone);
    const payload: any = { ...updates };
    // Never allow client to overwrite phone or wallet_balance via UPDATE
    delete payload.phone;
    delete payload.wallet_balance;
    delete payload.id;
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

/**
 * @deprecated Use insertUserProfile for new users, updateUserProfile for edits.
 * Kept for backward compatibility in saveUserToDB but routes to the correct path.
 */
export async function upsertUserProfile(
  profile: Partial<UserProfile> & { phone: string; first_name: string }
) {
  // If the user might already exist (we don't know), try UPDATE first, INSERT if 0 rows updated
  try {
    const canonicalPhone = normalizePhone(profile.phone);
    const updatePayload: any = {
      first_name: profile.first_name,
    };
    if (profile.last_name !== undefined) updatePayload.last_name = profile.last_name;
    if (profile.email !== undefined) updatePayload.email = profile.email;
    if (profile.push_token !== undefined) updatePayload.push_token = profile.push_token;

    const { data: updateData, error: updateErr } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('phone', canonicalPhone)
      .select()
      .maybeSingle();

    if (!updateErr && updateData) {
      return { data: updateData, error: null };
    }

    // No existing row found — INSERT as new user
    return await insertUserProfile({
      phone: canonicalPhone,
      first_name: profile.first_name,
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

    const sessionHeader = await buildSessionHeader(canonicalPhone);
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: { action: 'delete-account' },
      headers: { 'x-tidara-phone': sessionHeader },
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

    const sessionHeader = await buildSessionHeader(canonicalPhone);
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: {
        action: 'debit-wallet',
        amount: Math.round(amount),
        description: description || 'Service Booking Payment',
      },
      headers: { 'x-tidara-phone': sessionHeader },
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

    const sessionHeader = await buildSessionHeader(canonicalPhone);

    if (paymentId) {
      // Verify-and-credit: server verifies the Razorpay payment and computes bonus itself (W2)
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
        body: {
          action: 'verify-and-credit',
          paymentId,
        },
        headers: { 'x-tidara-phone': sessionHeader },
      });

      if (edgeErr) {
        return { success: false, error: edgeErr.message };
      }

      return {
        success: edgeData?.success === true,
        balance: edgeData?.balance,
        error: edgeData?.success === false ? (edgeData?.error || edgeData?.message) : undefined,
      };
    }

    // No paymentId → compensating rollback credit (called from handleWalletPayment rollback)
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('razorpay-order', {
      body: {
        action: 'rollback-credit',
        amount: Math.round(amount),
        description: description || 'Auto-Refund',
      },
      headers: { 'x-tidara-phone': sessionHeader },
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

export async function cancelBooking(id: string, userPhone: string) {
  try {
    const canonicalPhone = normalizePhone(userPhone);
    if (!canonicalPhone || !id) {
      return { success: false, data: null, error: new Error('User phone and booking ID are required') };
    }
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_phone', canonicalPhone)
      .eq('status', 'upcoming')
      .select();

    if (error) {
      return { success: false, data: null, error };
    }
    if (!data || data.length === 0) {
      return {
        success: false,
        data: null,
        error: new Error('Booking could not be cancelled. Only upcoming bookings belonging to your account can be cancelled.'),
      };
    }
    return { success: true, data: data[0], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err };
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
