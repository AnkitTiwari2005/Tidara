const WHATSY_BASE = 'https://honeydew-butterfly-241889.hostingersite.com';
const WHATSY_API_KEY = 'NW7tDgtm6CjzT1xWzz5pzkCa9dWA2jD9jtOJNOGnm4Y';

/**
 * Sends a 6-digit WhatsApp OTP to the specified mobile number with timeout guard.
 */
export async function sendWhatsAppOTP(
  phone: string
): Promise<{ success: boolean; message?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  // Send the clean 10-digit number or with +91 based on standard provider spec
  const cleanDigits = phone.replace(/\D/g, '').slice(-10);

  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/otp/send`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WHATSY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanDigits, digits: 6, expiry_minutes: 5 }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { message: res.ok ? 'OTP sent successfully' : 'Gateway temporary unavailable' };
    }

    const success = res.ok && data.success !== false;
    return {
      success,
      message: data.message ?? (success ? 'OTP sent successfully' : 'Failed to send OTP'),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Please check connection.' };
    }
    return { success: false, message: 'Network connection issue. Please retry.' };
  }
}

/**
 * Verifies the 6-digit OTP code with timeout and error classification.
 */
export async function verifyWhatsAppOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const cleanDigits = phone.replace(/\D/g, '').slice(-10);

  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/otp/verify`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WHATSY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanDigits, code: code.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { message: res.ok ? 'Verified' : 'Verification service error' };
    }

    const success = res.ok && data.success !== false && data.verified !== false;
    return {
      success,
      message: data.message ?? (success ? 'Code verified' : 'Invalid or expired OTP'),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Verification timed out. Please retry.' };
    }
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function checkWhatsyStatus(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/status`);
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
