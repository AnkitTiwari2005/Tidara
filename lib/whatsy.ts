const WHATSY_BASE = 'https://honeydew-butterfly-241889.hostingersite.com';
const WHATSY_API_KEY = 'NW7tDgtm6CjzT1xWzz5pzkCa9dWA2jD9jtOJNOGnm4Y';

export async function sendWhatsAppOTP(
  phone: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/otp/send`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WHATSY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, digits: 6, expiry_minutes: 5 }),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Network error' };
  }
}

export async function verifyWhatsAppOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${WHATSY_BASE}/api/v1/otp/verify`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WHATSY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Network error' };
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
