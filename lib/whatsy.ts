import { supabase } from './supabase';

const WHATSY_BASE = 'https://honeydew-butterfly-241889.hostingersite.com';

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
): Promise<{ success: boolean; message?: string }> {
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
    };
  } catch (err: any) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

/**
 * Sends a generic text notification to the customer on WhatsApp via Supabase Edge Function.
 */
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<{ success: boolean; message?: string }> {
  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  if (!cleanDigits || !message) {
    return { success: false, message: 'Recipient and message required' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('whatsy-otp', {
      body: { action: 'send-notification', phone: cleanDigits, message },
    });

    if (error) {
      return { success: false, message: error.message || 'Failed to send notification.' };
    }

    const success = data !== null && (data.success === true || data.status === 'queued' || data.status === 'sent');
    return {
      success,
      message: data?.message ?? (success ? 'Notification dispatched' : 'Failed to send notification'),
    };
  } catch {
    return { success: false, message: 'Network error sending notification' };
  }
}

/**
 * Dispatches a formatted booking confirmation on WhatsApp (non-blocking).
 */
export async function sendBookingConfirmationWhatsApp(params: {
  phone: string;
  customerName?: string;
  serviceNames: string[];
  totalAmount: number;
  paymentMethod: string;
  scheduledDisplay: string;
  address: string;
}): Promise<void> {
  const nameGreeting = params.customerName ? `Hi ${params.customerName.trim()}! ` : 'Hello! ';
  const servicesText = params.serviceNames.join(', ');

  const text =
    `🎉 *Tidara Booking Confirmed!*\n\n` +
    `${nameGreeting}Your service appointment has been booked successfully.\n\n` +
    `🛠 *Services:* ${servicesText}\n` +
    `⏰ *When:* ${params.scheduledDisplay}\n` +
    `📍 *Location:* ${params.address}\n` +
    `💳 *Payment:* ₹${params.totalAmount} (${params.paymentMethod})\n\n` +
    `Our verified service professional will reach your doorstep promptly. Track your booking directly in the Tidara app.\n\n` +
    `_Thank you for choosing Tidara!_`;

  // Fire and catch so it never crashes the checkout flow
  sendWhatsAppNotification(params.phone, text).catch(() => {});
}

/**
 * Dispatches a formatted booking cancellation notice on WhatsApp (non-blocking).
 */
export async function sendBookingCancellationWhatsApp(params: {
  phone: string;
  customerName?: string;
  serviceName: string;
}): Promise<void> {
  const nameGreeting = params.customerName ? `Hi ${params.customerName.trim()}, ` : 'Hello, ';

  const text =
    `ℹ️ *Tidara Booking Cancelled*\n\n` +
    `${nameGreeting}Your appointment for *${params.serviceName}* has been cancelled.\n\n` +
    `If you paid online or via wallet, any applicable refund will reflect in your account within 2-4 business days.\n\n` +
    `Need to reschedule? You can book anytime in the Tidara app.\n\n` +
    `_Tidara Customer Care_`;

  sendWhatsAppNotification(params.phone, text).catch(() => {});
}

export async function checkWhatsyStatus(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/status`);
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
