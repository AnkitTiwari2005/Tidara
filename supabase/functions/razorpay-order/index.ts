// Supabase Edge Function: razorpay-order
// Handles Razorpay order creation, payment verification, and privileged wallet operations.
// All privileged actions (debit, credit, delete) derive the acting phone from the app's
// session token header (X-Tidara-Phone) signed with TIDARA_SESSION_SECRET, never from the body.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tidara-phone',
};

/**
 * Verify the X-Tidara-Phone header HMAC.
 * The client signs the canonical phone with HMAC-SHA256(TIDARA_SESSION_SECRET, phone)
 * and sends "phone:hex_signature" as the header value.
 * This prevents one user from sending another user's phone in the body.
 */
async function verifyCallerPhone(req: Request, sessionSecret: string): Promise<string | null> {
  const headerValue = req.headers.get('x-tidara-phone');
  if (!headerValue) return null;

  const colonIdx = headerValue.lastIndexOf(':');
  if (colonIdx < 1) return null;

  const phone = headerValue.slice(0, colonIdx);
  const sigHex = headerValue.slice(colonIdx + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(phone));
  const expectedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time compare to prevent timing attacks
  if (sigHex.length !== expectedHex.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return mismatch === 0 ? phone : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_Tu0bQc9VvUOCR0';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sessionSecret = Deno.env.get('TIDARA_SESSION_SECRET');

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Helper to invoke Supabase RPC using the privileged service_role key
    const invokeServiceRpc = async (rpcName: string, rpcArgs: Record<string, any>) => {
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase service role credentials not configured');
      }
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(rpcArgs),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        // Surface PostgREST errors clearly
        throw new Error(json?.message || json?.hint || `RPC ${rpcName} failed with status ${res.status}`);
      }
      return json;
    };

    // ─────────────────────────────────────────────────────────────
    // Action 1: Verify Razorpay Payment & Credit Wallet (W2)
    // Bonus is computed server-side from verified amount only.
    // Payment must be captured (not merely authorized).
    // ─────────────────────────────────────────────────────────────
    if (action === 'verify-and-credit') {
      // Caller identity is verified via HMAC-signed phone header (W1)
      if (!sessionSecret) {
        return new Response(
          JSON.stringify({ success: false, message: 'TIDARA_SESSION_SECRET is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const callerPhone = await verifyCallerPhone(req, sessionSecret);
      if (!callerPhone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized: missing or invalid session token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { paymentId } = body;
      if (!paymentId || typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid Razorpay paymentId is required' }),
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

      // Only accept captured (settled) payments, not merely authorized ones (W2)
      if (!payRes.ok || !payData || payData.status !== 'captured') {
        return new Response(
          JSON.stringify({
            success: false,
            message: payData?.status
              ? `Payment status is "${payData.status}"; only captured payments can be credited.`
              : payData?.error?.description || 'Payment verification failed',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure currency is INR (W2)
      if (payData.currency !== 'INR') {
        return new Response(
          JSON.stringify({ success: false, message: 'Only INR payments are accepted' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verified amount from Razorpay (paise → rupees); bonus computed server-side (W2)
      const verifiedAmount = Math.round(Number(payData.amount || 0) / 100);
      const serverBonus = verifiedAmount >= 250 ? Math.floor(verifiedAmount * 0.05) : 0;

      let rpcResult: any;
      try {
        rpcResult = await invokeServiceRpc('credit_wallet', {
          p_phone: callerPhone,
          p_amount: verifiedAmount,
          p_bonus: serverBonus,
          p_description: 'Razorpay Top-up',
          p_payment_id: paymentId,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message || 'Database credit failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Database credit RPC returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 2: Privileged Server-Side Debit (W1)
    // Phone derived from verified HMAC token, not body.
    // ─────────────────────────────────────────────────────────────
    if (action === 'debit-wallet') {
      if (!sessionSecret) {
        return new Response(
          JSON.stringify({ success: false, message: 'TIDARA_SESSION_SECRET is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const callerPhone = await verifyCallerPhone(req, sessionSecret);
      if (!callerPhone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized: missing or invalid session token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { amount, description } = body;
      if (!amount || Number(amount) <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid positive amount is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let rpcResult: any;
      try {
        rpcResult = await invokeServiceRpc('debit_wallet', {
          p_phone: callerPhone,
          p_amount: Math.round(Number(amount)),
          p_description: description || 'Service Booking Payment',
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message || 'Database debit failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Database debit RPC returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 3: Rollback Credit (used only after a failed booking insert)
    // No paymentId – purely compensating; uses caller's own phone.
    // ─────────────────────────────────────────────────────────────
    if (action === 'rollback-credit') {
      if (!sessionSecret) {
        return new Response(
          JSON.stringify({ success: false, message: 'TIDARA_SESSION_SECRET is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const callerPhone = await verifyCallerPhone(req, sessionSecret);
      if (!callerPhone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized: missing or invalid session token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { amount, description } = body;
      if (!amount || Number(amount) <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid positive amount is required for rollback' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let rpcResult: any;
      try {
        rpcResult = await invokeServiceRpc('credit_wallet', {
          p_phone: callerPhone,
          p_amount: Math.round(Number(amount)),
          p_bonus: 0,
          p_description: description || 'Auto-Refund: Booking failed',
          p_payment_id: null,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message || 'Rollback credit failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Rollback credit RPC returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 4: Privileged Account Deletion (W1)
    // Phone derived from verified HMAC token, not body.
    // ─────────────────────────────────────────────────────────────
    if (action === 'delete-account') {
      if (!sessionSecret) {
        return new Response(
          JSON.stringify({ success: false, message: 'TIDARA_SESSION_SECRET is not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const callerPhone = await verifyCallerPhone(req, sessionSecret);
      if (!callerPhone) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized: missing or invalid session token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let rpcResult: any;
      try {
        rpcResult = await invokeServiceRpc('delete_user_account', {
          p_phone: callerPhone,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message || 'Account deletion failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Delete account RPC returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Default Action: Create Razorpay Order
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
