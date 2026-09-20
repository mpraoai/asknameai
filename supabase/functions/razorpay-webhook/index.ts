import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Receives Razorpay's subscription lifecycle events (renewal, failure,
cancellation) and keeps the `subscriptions` + numerologist_profiles
tables in sync - without this, "subscription billing" would only ever
reflect the moment someone clicked subscribe, never what actually
happened to their card after that. Configure this URL in the Razorpay
dashboard's webhook settings, with RAZORPAY_WEBHOOK_SECRET set to the
same secret entered there.

Verifies the X-Razorpay-Signature header (HMAC-SHA256 over the raw body)
before trusting anything in the payload - an unverified webhook endpoint
is an open door to fake "payment succeeded" events.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Razorpay-Signature",
};

async function getSupabaseClient() {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(supabaseUrl, serviceRoleKey);
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expectedHex === signature;
}

// Maps a Razorpay subscription event to our own status vocabulary
// (numerologist_profiles.subscription_status is trial/active/past_due/cancelled).
const STATUS_MAP: Record<string, { subStatus: string; profileStatus: string | null }> = {
  "subscription.authenticated": { subStatus: "authenticated", profileStatus: null },
  "subscription.activated": { subStatus: "active", profileStatus: "active" },
  "subscription.charged": { subStatus: "active", profileStatus: "active" },
  "subscription.pending": { subStatus: "past_due", profileStatus: "past_due" },
  "subscription.halted": { subStatus: "past_due", profileStatus: "past_due" },
  "subscription.cancelled": { subStatus: "cancelled", profileStatus: "cancelled" },
  "subscription.completed": { subStatus: "completed", profileStatus: "cancelled" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature") || "";
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string;
    const mapping = STATUS_MAP[event];

    if (!mapping) {
      // Unhandled but validly-signed event - acknowledge so Razorpay stops retrying, do nothing else.
      return new Response(JSON.stringify({ received: true, handled: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpaySubscriptionId = payload.payload?.subscription?.entity?.id;
    if (!razorpaySubscriptionId) {
      return new Response(JSON.stringify({ error: "No subscription id in payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentPeriodEndUnix = payload.payload?.subscription?.entity?.current_end;
    const supabase = await getSupabaseClient();

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("id, numerologist_id")
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .maybeSingle();

    if (!subRow) {
      console.error("Webhook for unknown subscription:", razorpaySubscriptionId);
      return new Response(JSON.stringify({ received: true, handled: false, reason: "unknown subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("subscriptions").update({
      status: mapping.subStatus,
      current_period_end: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", subRow.id);

    if (mapping.profileStatus) {
      await supabase.from("numerologist_profiles")
        .update({ subscription_status: mapping.profileStatus })
        .eq("id", subRow.numerologist_id);
    }

    return new Response(JSON.stringify({ received: true, handled: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
