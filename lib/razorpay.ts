// Razorpay integration helpers
export const RAZORPAY_KEY_ID = 'rzp_test_Tu0bQc9VvUOCR0';
const RAZORPAY_KEY_SECRET = 'ldQc4YazS5sRY8wbRe87Sr4i';

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Hermes-safe base64 encoding (avoids missing btoa crash in React Native)
function encodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input;
  let output = '';

  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('Base64 encoding error: input contains characters outside Latin1 range.');
    }
    block = (block << 8) | charCode;
  }

  return output;
}

/**
 * Create a Razorpay order via their REST API.
 * Amount should be in PAISE (multiply ₹ by 100).
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  receipt: string
): Promise<RazorpayOrderResponse> {
  const sanitizedAmount = Math.max(100, Math.round(amountInPaise));
  const sanitizedReceipt = receipt.slice(0, 40); // Razorpay max receipt length is 40 chars

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const credentials = encodeBase64(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'Failed to initialize payment gateway order';
      try {
        const err = await response.json();
        if (err.error?.description) errorMsg = err.error.description;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Payment gateway timed out. Please check your connection and retry.');
    }
    throw err;
  }
}

/**
 * Generates the HTML page that opens Razorpay Checkout inside a WebView safely.
 */
export function getRazorpayCheckoutHTML(params: {
  orderId: string;
  amount: number; // in paise
  name: string;
  phone: string;
  description: string;
}): string {
  const optionsObj = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(params.amount),
    currency: 'INR',
    name: 'Tidara Home Services',
    description: params.description || 'Verified Home Services',
    order_id: params.orderId,
    prefill: {
      name: params.name || 'Valued Customer',
      contact: params.phone || '',
    },
    theme: { color: '#0B5335' },
  };

  const safeOptionsJSON = JSON.stringify(optionsObj).replace(/<\/script/gi, '<\\/script');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      background: #F8FAFC;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .loader {
      text-align: center;
      color: #064E3B;
      padding: 24px;
    }
    .spinner {
      border: 3px solid #E2E8F0;
      border-top: 3px solid #059669;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .label {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.2px;
    }
    .sub {
      font-size: 12px;
      color: #64748B;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <div class="label">Opening Secure Payment</div>
    <div class="sub">Connecting to 256-bit encrypted gateway...</div>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js" onerror="handleScriptError()"></script>
  <script>
    function handleScriptError() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          error: 'Failed to load Razorpay payment script. Please check your internet connection.'
        }));
      }
    }

    try {
      var baseOptions = ${safeOptionsJSON};
      baseOptions.handler = function(response) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          }));
        }
      };
      baseOptions.modal = {
        ondismiss: function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false,
              cancelled: true
            }));
          }
        }
      };

      var rzp = new Razorpay(baseOptions);

      // Register failed listener before open
      rzp.on('payment.failed', function(response) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: false,
            error: response.error ? response.error.description : 'Payment failed'
          }));
        }
      });

      rzp.open();
    } catch(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          error: 'Initialization error: ' + (e.message || 'Unknown error')
        }));
      }
    }
  </script>
</body>
</html>
  `.trim();
}
