import { supabase } from './supabase';

/**
 * Sends a 6-digit WhatsApp OTP to the specified mobile number via Supabase Edge Function
 * (keeps WHATSY_API_KEY secure in Supabase Secrets).
 */
export async function sendWhatsAppOTP(
  phone: string
): Promise<{ success: boolean; message?: string }> {
  const cleanDigits = phone.replace(/\D/g, '').slice(-10);

  try {
    const { data, error } = await supabase.functions.invoke('whatsy-otp', {
      body: { action: 'send', phone: cleanDigits },
    });

    if (error) {
      return { success: false, message: error.message || 'Failed to dispatch OTP. Please retry.' };
    }

    const success = data !== null && (data.success === true || data.status === 'success');
    return {
      success,
      message: data?.message ?? (success ? 'OTP sent successfully via WhatsApp' : 'Failed to send OTP'),
    };
  } catch (err: any) {
    return { success: false, message: 'Network connection issue. Please retry.' };
  }
}

/**
 * Verifies the 6-digit OTP code via Supabase Edge Function.
 */
export async function verifyWhatsAppOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; message?: string; token?: string; phone?: string }> {
  const cleanDigits = phone.replace(/\D/g, '').slice(-10);

  try {
    const { data, error } = await supabase.functions.invoke('whatsy-otp', {
      body: { action: 'verify', phone: cleanDigits, code: code.trim() },
    });

    if (error) {
      return { success: false, message: error.message || 'Verification failed. Please retry.' };
    }

    const success =
      data !== null &&
      (data.success === true || data.verified === true || data.status === 'verified');

    return {
      success,
      message: data?.message ?? (success ? 'Code verified' : 'Invalid or expired OTP'),
      token: data?.token,
      phone: data?.phone,
    };
  } catch (err: any) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function checkWhatsyStatus(): Promise<{ ok: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('whatsy-otp', {
      body: { action: 'status' },
    });
    return { ok: !error && data?.ok === true };
  } catch {
    return { ok: false };
  }
}
