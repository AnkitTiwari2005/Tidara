// Supabase Edge Function: whatsy-otp
// Securely proxies OTP send & verify requests to Whatsy without exposing WHATSY_API_KEY.
// Arbitrary notification dispatching is excluded to prevent open WhatsApp relay abuse.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('WHATSY_API_KEY');
    const baseUrl = Deno.env.get('WHATSY_BASE');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ success: false, message: 'Whatsy credentials not configured on Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // 1. Dispatch OTP
    if (action === 'send') {
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

      const res = await fetch(`${baseUrl}/api/v1/otp/verify`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanDigits, code }),
      });

      const data = await res.json().catch(() => null);
      const isVerified = res.ok && data !== null && data.success === true;

      return new Response(
        JSON.stringify({
          success: isVerified,
          message: isVerified ? 'Verified' : (data?.message || 'Invalid or expired OTP code'),
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
