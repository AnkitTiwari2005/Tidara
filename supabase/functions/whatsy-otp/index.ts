// Supabase Edge Function: whatsy-otp
// Securely proxies OTP send & verify requests to Whatsy without exposing WHATSY_API_KEY to the mobile client.

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
    const baseUrl = Deno.env.get('WHATSY_BASE') || 'https://honeydew-butterfly-241889.hostingersite.com';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'WHATSY_API_KEY is not configured on Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, phone, code } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);

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
    } else if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, message: 'OTP code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const res = await fetch(`${baseUrl}/api/v1/otp/verify`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanDigits, code: String(code).trim() }),
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
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid action. Must be "send" or "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err?.message || 'Internal error in whatsy-otp function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
