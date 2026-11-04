// Supabase Edge Function: razorpay-order
// 1. Generates authenticated Razorpay orders server-side without exposing RAZORPAY_KEY_SECRET.
// 2. Verifies Razorpay payments against Razorpay's API and securely credits wallets with service-role (V1, V3).
// 3. Executes privileged debit and account deletion with service-role credentials.

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Helper to invoke Supabase RPC using the privileged service_role key
    const invokeServiceRpc = async (rpcName: string, rpcArgs: Record<string, any>) => {
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase service role credentials not configured in edge function');
      }
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpcArgs),
      });
      return await res.json().catch(() => null);
    };

    // ─────────────────────────────────────────────────────────────
    // Action 1: Verify Razorpay Payment & Credit Wallet (V1, V3)
    // ─────────────────────────────────────────────────────────────
    if (action === 'verify-and-credit') {
      const { paymentId, phone, bonus, description } = body;
      if (!paymentId || !phone) {
        return new Response(
          JSON.stringify({ success: false, message: 'paymentId and phone are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!keySecret) {
        return new Response(
          JSON.stringify({ success: false, message: 'RAZORPAY_KEY_SECRET is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify payment with Razorpay's official API
      const credentials = btoa(`${keyId}:${keySecret}`);
      const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}` },
      });

      const payData = await payRes.json().catch(() => null);
      if (!payRes.ok || !payData || (payData.status !== 'captured' && payData.status !== 'authorized')) {
        return new Response(
          JSON.stringify({ success: false, message: payData?.error?.description || 'Payment verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate verified amount in Rupees
      const verifiedAmount = Math.round(Number(payData.amount || 0) / 100);
      const bonusAmount = Math.max(0, Math.round(Number(bonus) || 0));

      const rpcResult = await invokeServiceRpc('credit_wallet', {
        p_phone: phone,
        p_amount: verifiedAmount,
        p_bonus: bonusAmount,
        p_description: description || 'Razorpay Top-up',
        p_payment_id: paymentId,
      });

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Database credit RPC failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 2: Privileged Server-Side Debit (V1, V2)
    // ─────────────────────────────────────────────────────────────
    if (action === 'debit-wallet') {
      const { phone, amount, description } = body;
      if (!phone || !amount || amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid phone and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rpcResult = await invokeServiceRpc('debit_wallet', {
        p_phone: phone,
        p_amount: Math.round(amount),
        p_description: description || 'Service Booking Payment',
      });

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Database debit RPC failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 3: Privileged Account Deletion (V1, V6)
    // ─────────────────────────────────────────────────────────────
    if (action === 'delete-account') {
      const { phone } = body;
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Phone is required for deletion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rpcResult = await invokeServiceRpc('delete_user_account', {
        p_phone: phone,
      });

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Database delete RPC failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Default Action: Create Order
    // ─────────────────────────────────────────────────────────────
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: { description: 'RAZORPAY_KEY_SECRET is not configured on Supabase' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, receipt } = body;
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
      JSON.stringify({ error: { description: err?.message || 'Internal error in razorpay-order function' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
