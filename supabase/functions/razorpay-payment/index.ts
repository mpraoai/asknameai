import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getSupabaseClient() {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(supabaseUrl, serviceRoleKey);
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
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay keys not configured" }),
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

    const body = await req.json();
    const action = body.action;

    // --- CREATE ORDER ---
    if (action === "create-order") {
      const amountInPaise = Math.round(body.amount * 100);

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
            user_email: body.user_email || "",
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

      const supabase = await getSupabaseClient();
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
        console.error("DB insert error:", dbError.message);
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

    // --- VERIFY PAYMENT ---
    if (action === "verify-payment") {
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

      const supabase = await getSupabaseClient();

      if (isValid) {
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
          console.error("DB update error:", updateError.message);
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
      JSON.stringify({ error: "Invalid action. Use create-order or verify-payment." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err.message || err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
