// Supabase Edge Function: razorpay-order
// Generates authenticated Razorpay orders server-side without exposing RAZORPAY_KEY_SECRET to the client.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_Tu0bQc9VvUOCR0';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: { description: 'RAZORPAY_KEY_SECRET is not configured on Supabase' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, receipt } = await req.json();

    const sanitizedAmount = Math.max(100, Math.round(Number(amount) || 0));
    const sanitizedReceipt = String(receipt || `rcpt_${Date.now()}`).slice(0, 40);

    const credentials = btoa(`${keyId}:${keySecret}`);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: sanitizedAmount,
        currency: 'INR',
        receipt: sanitizedReceipt,
        payment_capture: 1,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: { description: data?.error?.description || 'Failed to create Razorpay order' } }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: { description: err?.message || 'Internal error creating order' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
