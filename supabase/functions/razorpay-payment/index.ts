import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateOrderRequest {
  plan_id: string;
  plan_name: string;
  amount: number;
  user_email: string;
  user_name: string;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: string;
  plan_name: string;
  amount: number;
}

async function getSupabaseClient(req: Request) {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Use service role for database writes (payments table)
  return createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser();
  return user;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "create-order") {
      const body: CreateOrderRequest = await req.json();
      const amountInPaise = Math.round(body.amount * 100);

      // Create Razorpay order
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            plan_id: body.plan_id,
            plan_name: body.plan_name,
            user_email: body.user_email,
            user_id: user.id,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.text();
        return new Response(
          JSON.stringify({ error: "Failed to create Razorpay order", details: errData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const order = await orderResponse.json();

      // Save payment record in database
      const supabase = await getSupabaseClient(req);
      const { error: dbError } = await supabase.from("payments").insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        plan_id: body.plan_id,
        plan_name: body.plan_name,
        amount: amountInPaise,
        currency: "INR",
        status: "created",
      });

      if (dbError) {
        console.error("DB insert error:", dbError);
      }

      return new Response(
        JSON.stringify({
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: razorpayKeyId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "verify-payment") {
      const body: VerifyPaymentRequest = await req.json();

      // Verify signature using HMAC SHA256
      const expectedSignature = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(razorpayKeySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const data = new TextEncoder().encode(`${body.razorpay_order_id}|${body.razorpay_payment_id}`);
      const signatureBuffer = await crypto.subtle.sign("HMAC", expectedSignature, data);
      const expectedHex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const isValid = expectedHex === body.razorpay_signature;

      const supabase = await getSupabaseClient(req);

      if (isValid) {
        // Update payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            razorpay_payment_id: body.razorpay_payment_id,
            razorpay_signature: body.razorpay_signature,
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", body.razorpay_order_id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("DB update error:", updateError);
        }

        return new Response(
          JSON.stringify({ verified: true, message: "Payment verified successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("razorpay_order_id", body.razorpay_order_id)
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ verified: false, error: "Signature verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid endpoint. Use create-order or verify-payment." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
