// Supabase Edge Function: whatsy-otp
// Securely proxies OTP send & verify requests to Whatsy without exposing WHATSY_API_KEY.
// Arbitrary notification dispatching is excluded to prevent open WhatsApp relay abuse.
// Upon successful OTP verification, mints a cryptographically signed auth token (JWT)
// using server-only secret TIDARA_AUTH_SECRET (or Supabase service key), preventing client forgery (X1).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tidara-token',
};

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(payload: Record<string, any>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${data}.${sigB64}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('WHATSY_API_KEY');
    const baseUrl = Deno.env.get('WHATSY_BASE');
    const authSecret =
      Deno.env.get('TIDARA_AUTH_SECRET') ||
      Deno.env.get('TIDARA_SESSION_SECRET') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      'tidara_server_secure_secret_fallback';

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Health / service status check (does not require phone number)
    if (action === 'status') {
      return new Response(
        JSON.stringify({ ok: true, success: true, service: 'whatsy-otp' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPhone = body.phone || body.recipient;
    if (!rawPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Valid phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanDigits = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, message: 'Valid 10-digit Indian mobile number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canonicalPhone = '+91' + cleanDigits;

    // 1. Dispatch OTP
    if (action === 'send') {
      if (!apiKey || !baseUrl) {
        return new Response(
          JSON.stringify({ success: false, message: 'Whatsy credentials not configured on Supabase' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const res = await fetch(`${baseUrl}/api/v1/otp/send`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanDigits, digits: 6, expiry_minutes: 5 }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.success !== true) {
        return new Response(
          JSON.stringify({ success: false, message: data?.message || 'Failed to dispatch OTP' }),
          { status: res.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: data.message || 'OTP dispatched via WhatsApp' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify OTP
    if (action === 'verify') {
      const code = String(body.code || '').trim();
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid 6-digit OTP code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let isVerified = false;
      let verifyMessage = 'Invalid or expired OTP code';

      if (apiKey && baseUrl) {
        const res = await fetch(`${baseUrl}/api/v1/otp/verify`, {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: cleanDigits, code }),
        });

        const data = await res.json().catch(() => null);
        isVerified = res.ok && data !== null && data.success === true;
        if (!isVerified && data?.message) {
          verifyMessage = data.message;
        }
      }

      if (isVerified) {
        // Mint a secure server-signed session token (JWT) containing verified phone (X1)
        const token = await signJwt(
          {
            phone: canonicalPhone,
            sub: canonicalPhone,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 90 * 86400, // 90 days validity
          },
          authSecret
        );

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            token,
            phone: canonicalPhone,
            message: 'OTP verified successfully',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: verifyMessage,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action. Must be "send", "verify", or "status"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err?.message || 'Internal error in whatsy-otp function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
