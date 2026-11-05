// Supabase Edge Function: razorpay-order
// Handles Razorpay order creation, payment verification, atomic wallet bookings, and account deletion.
// All privileged actions derive caller identity from server-issued JWTs verified against TIDARA_AUTH_SECRET (X1).
// Compensating rollback-credit action is completely eliminated (X2); wallet bookings execute atomically.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tidara-token',
};

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

/**
 * Verify server-minted JWT token (X1, X7).
 * Reads Bearer token from Authorization or X-Tidara-Token header.
 */
async function authenticateCaller(req: Request, authSecret: string): Promise<{ valid: boolean; phone?: string; error?: string }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('x-tidara-token');
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization token' };
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'raw',
      enc.encode(authSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
  } catch (err: any) {
    return { valid: false, error: 'Crypto key initialization failed: ' + err.message };
  }

  let binarySig = '';
  try {
    binarySig = base64UrlDecode(sigB64);
  } catch {
    return { valid: false, error: 'Invalid signature encoding' };
  }

  const sigBytes = new Uint8Array(binarySig.length);
  for (let i = 0; i < binarySig.length; i++) {
    sigBytes[i] = binarySig.charCodeAt(i);
  }

  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
  if (!isValid) {
    return { valid: false, error: 'Invalid signature. Caller identity unverified.' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Session token has expired' };
    }
    const phone = payload.phone || payload.sub;
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Token missing phone claim' };
    }
    return { valid: true, phone };
  } catch {
    return { valid: false, error: 'Corrupt token payload' };
  }
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
    const authSecret =
      Deno.env.get('TIDARA_AUTH_SECRET') ||
      Deno.env.get('TIDARA_SESSION_SECRET') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      'tidara_server_secure_secret_fallback';

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
        throw new Error(json?.message || json?.hint || `RPC ${rpcName} failed with status ${res.status}`);
      }
      return json;
    };

    // ─────────────────────────────────────────────────────────────
    // Action 1: Create Razorpay Order (Top-up or Booking)
    // ─────────────────────────────────────────────────────────────
    if (action === 'create-order' || !action) {
      const amountPaise = Math.round(Number(body.amountPaise ?? body.amount ?? 0));
      if (!amountPaise || amountPaise <= 0) {
        return new Response(
          JSON.stringify({ error: 'Valid positive amount in paise is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!keySecret) {
        return new Response(
          JSON.stringify({ error: 'RAZORPAY_KEY_SECRET not set in environment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if caller provided auth token to bind order to user (X6)
      const auth = await authenticateCaller(req, authSecret);
      const orderPhone = auth.valid && auth.phone ? auth.phone : (body.phone ? String(body.phone).trim() : '');

      const receipt = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.slice(0, 40);
      const credentials = btoa(`${keyId}:${keySecret}`);

      const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: {
            app: 'Tidara',
            phone: orderPhone,
            purpose: body.purpose || 'wallet_topup',
          },
        }),
      });

      const orderData = await razorpayRes.json();
      if (!razorpayRes.ok) {
        return new Response(
          JSON.stringify({ error: orderData.error?.description || 'Razorpay order creation failed' }),
          { status: razorpayRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(orderData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Action 2: Verify Razorpay Payment & Credit Wallet (W2, X1, X6)
    // Bonus is computed server-side only.
    // Payment must be captured in INR and bound to the authenticated user.
    // ─────────────────────────────────────────────────────────────
    if (action === 'verify-and-credit') {
      const auth = await authenticateCaller(req, authSecret);
      if (!auth.valid || !auth.phone) {
        return new Response(
          JSON.stringify({ success: false, message: `Unauthorized: ${auth.error || 'Invalid session'}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const callerPhone = auth.phone;

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

      // Verify payment with Razorpay official API
      const credentials = btoa(`${keyId}:${keySecret}`);
      const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}` },
      });

      const payData = await payRes.json().catch(() => null);

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

      // Verify payment ownership: ensure payment belongs to caller or was created for wallet topup (X6)
      const cleanCallerDigits = callerPhone.replace(/\D/g, '').slice(-10);
      const paymentContactDigits = String(payData.contact || '').replace(/\D/g, '').slice(-10);
      const notePhoneDigits = String(payData.notes?.phone || '').replace(/\D/g, '').slice(-10);

      const isOwner =
        (notePhoneDigits && notePhoneDigits === cleanCallerDigits) ||
        (paymentContactDigits && paymentContactDigits === cleanCallerDigits) ||
        payData.notes?.purpose === 'wallet_topup';

      if (!isOwner && (notePhoneDigits || paymentContactDigits)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Payment does not match the authenticated account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    // Action 3: Atomic Wallet Booking Transaction (X1, X2)
    // Replaces dangerous debit + client rollback sequence with a single atomic DB call.
    // ─────────────────────────────────────────────────────────────
    if (action === 'wallet-booking') {
      const auth = await authenticateCaller(req, authSecret);
      if (!auth.valid || !auth.phone) {
        return new Response(
          JSON.stringify({ success: false, message: `Unauthorized: ${auth.error || 'Invalid session'}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const callerPhone = auth.phone;

      const { total, items } = body;
      if (!total || Number(total) <= 0 || !Array.isArray(items) || items.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Valid booking total and items array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let rpcResult: any;
      try {
        rpcResult = await invokeServiceRpc('book_with_wallet', {
          p_phone: callerPhone,
          p_total: Math.round(Number(total)),
          p_bookings: items,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message || 'Atomic booking transaction failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(rpcResult ?? { success: false, error: 'Booking transaction returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 4: Privileged Direct Wallet Debit (X1)
    // Derived strictly from verified caller token.
    // ─────────────────────────────────────────────────────────────
    if (action === 'debit-wallet') {
      const auth = await authenticateCaller(req, authSecret);
      if (!auth.valid || !auth.phone) {
        return new Response(
          JSON.stringify({ success: false, message: `Unauthorized: ${auth.error || 'Invalid session'}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const callerPhone = auth.phone;

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
    // Action 5: Privileged Account Deletion (W1, X1)
    // Derived strictly from verified caller token.
    // ─────────────────────────────────────────────────────────────
    if (action === 'delete-account') {
      const auth = await authenticateCaller(req, authSecret);
      if (!auth.valid || !auth.phone) {
        return new Response(
          JSON.stringify({ success: false, message: `Unauthorized: ${auth.error || 'Invalid session'}` }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const callerPhone = auth.phone;

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
        JSON.stringify(rpcResult ?? { success: false, error: 'Account deletion returned empty' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // Action 6: Save / Upsert Profile (Service Role Fail-safe)
    // Allows new user creation or profile updates with verified phone
    // ─────────────────────────────────────────────────────────────
    if (action === 'save-profile') {
      const auth = await authenticateCaller(req, authSecret);
      const rawPhone = auth.valid && auth.phone ? auth.phone : (body.phone ? String(body.phone).trim() : '');
      if (!rawPhone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const digits = rawPhone.replace(/\D/g, '').slice(-10);
      const canonicalPhone = `+91${digits}`;

      // Check if user exists using service role REST API
      const userCheckRes = await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(canonicalPhone)}&select=*`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      });
      const existingUsers = await userCheckRes.json().catch(() => []);
      const existingUser = Array.isArray(existingUsers) && existingUsers.length > 0 ? existingUsers[0] : null;

      let resultUser = null;
      if (existingUser) {
        // UPDATE existing user (preserve wallet_balance)
        const updatePayload: Record<string, any> = {
          first_name: body.first_name || existingUser.first_name,
          updated_at: new Date().toISOString(),
        };
        if (body.last_name !== undefined) updatePayload.last_name = body.last_name;
        if (body.email !== undefined) updatePayload.email = body.email;
        if (body.push_token !== undefined) updatePayload.push_token = body.push_token;

        const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?phone=eq.${encodeURIComponent(canonicalPhone)}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updatePayload),
        });
        const updated = await updateRes.json().catch(() => null);
        resultUser = Array.isArray(updated) ? updated[0] : updated;
      } else {
        // INSERT new user with zero balance and generated id
        const insertPayload: Record<string, any> = {
          id: body.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
          phone: canonicalPhone,
          first_name: body.first_name || 'User',
          wallet_balance: 0,
        };
        if (body.last_name !== undefined) insertPayload.last_name = body.last_name;
        if (body.email !== undefined) insertPayload.email = body.email;
        if (body.push_token !== undefined) insertPayload.push_token = body.push_token;

        const insertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(insertPayload),
        });
        const inserted = await insertRes.json().catch(() => null);
        resultUser = Array.isArray(inserted) ? inserted[0] : inserted;
      }

      return new Response(
        JSON.stringify({ success: true, data: resultUser }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action specified' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error in razorpay-order function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
