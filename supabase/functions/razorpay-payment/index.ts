import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getSupabaseClient() {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
}

async function getUserFromRequest(req: Request) {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await client.auth.getUser();
  return user;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay keys not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const action = body.action;
    const authHeader = "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    if (action === "create-payment-link") {
      const amountInPaise = Math.round(body.amount * 100);
      const planName = body.plan_name || "AskNameAI Plan";
      const planId = body.plan_id || "";
      const userEmail = body.user_email || user.email || "";
      const userName = body.user_name || "";
      const method = body.method || "all";
      const origin = body.origin || "https://bolt.new";

      const linkBody: Record<string, unknown> = {
        amount: amountInPaise, currency: "INR", accept_partial: false,
        description: planName, customer: { name: userName, email: userEmail },
        notify: { sms: false, email: false }, reminder_enable: false,
        notes: { plan_id: planId, plan_name: planName, user_id: user.id, user_email: userEmail },
        callback_url: `${origin}/payment-callback.html`, callback_method: "get",
      };

      if (method === "upi") linkBody.options = { order: { method: "upi" } };
      else if (method === "card") linkBody.options = { order: { method: "card" } };

      const linkResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify(linkBody),
      });

      if (!linkResponse.ok) {
        const errData = await linkResponse.text();
        return new Response(JSON.stringify({ error: "Failed to create payment link", details: errData }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const link = await linkResponse.json();
      const supabase = await getSupabaseClient();
      await supabase.from("payments").insert({ user_id: user.id, razorpay_order_id: link.order_id || link.id, plan_id: planId || null, plan_name: planName, amount: amountInPaise, currency: "INR", status: "created" });

      return new Response(JSON.stringify({ payment_link_id: link.id, payment_link_url: link.short_url || link.url, order_id: link.order_id || link.id, key_id: razorpayKeyId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify-payment") {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(razorpayKeySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const data = new TextEncoder().encode(`${body.razorpay_order_id}|${body.razorpay_payment_id}`);
      const sigBuf = await crypto.subtle.sign("HMAC", key, data);
      const expectedHex = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      const isValid = expectedHex === body.razorpay_signature;
      const supabase = await getSupabaseClient();

      if (isValid) {
        await supabase.from("payments").update({ razorpay_payment_id: body.razorpay_payment_id, razorpay_signature: body.razorpay_signature, status: "paid", updated_at: new Date().toISOString() }).eq("razorpay_order_id", body.razorpay_order_id).eq("user_id", user.id);
        return new Response(JSON.stringify({ verified: true, message: "Payment verified successfully" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        await supabase.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("razorpay_order_id", body.razorpay_order_id).eq("user_id", user.id);
        return new Response(JSON.stringify({ verified: false, error: "Signature verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use create-payment-link or verify-payment." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Edge function error:", err.message || err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
