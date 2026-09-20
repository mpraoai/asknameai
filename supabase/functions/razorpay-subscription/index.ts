import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Real recurring subscription billing for numerologist accounts (PRD
Section 6 / Build Order Phase B) - separate from the existing
razorpay-payment function, which keeps handling one-time report
purchases exactly as it does today, untouched. This function creates a
Razorpay Subscription object (auto-renewing), not an Order (single
charge) - that distinction is what actually makes this a subscription
instead of a repeated manual payment.
*/

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

async function razorpayFetch(path: string, keyId: string, keySecret: string, init: RequestInit = {}) {
  return fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${keyId}:${keySecret}`),
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay keys not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (body.action !== "create-subscription") {
      return new Response(JSON.stringify({ error: "Invalid action. Use create-subscription." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.plan_id || !body.numerologist_id) {
      return new Response(JSON.stringify({ error: "Missing plan_id or numerologist_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = await getSupabaseClient();

    // Confirm the caller actually owns this numerologist_profiles row before billing it.
    const { data: numerologist } = await supabase
      .from("numerologist_profiles")
      .select("id, user_profile_id, user_profiles!inner(auth_user_id)")
      .eq("id", body.numerologist_id)
      .maybeSingle();
    if (!numerologist || (numerologist as any).user_profiles?.auth_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "You do not own this numerologist account" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly_inr, razorpay_plan_id")
      .eq("id", body.plan_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Razorpay Plans are created once and reused - create it lazily on first subscribe, then cache the id.
    let razorpayPlanId = plan.razorpay_plan_id as string | null;
    if (!razorpayPlanId) {
      const planRes = await razorpayFetch("/plans", razorpayKeyId, razorpayKeySecret, {
        method: "POST",
        body: JSON.stringify({
          period: "monthly",
          interval: 1,
          item: {
            name: `AskNameAI ${plan.name}`,
            amount: plan.price_monthly_inr,
            currency: "INR",
          },
        }),
      });
      if (!planRes.ok) {
        const errText = await planRes.text();
        return new Response(JSON.stringify({ error: "Failed to create Razorpay plan", details: errText.slice(0, 300) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const razorpayPlan = await planRes.json();
      razorpayPlanId = razorpayPlan.id;
      await supabase.from("subscription_plans").update({ razorpay_plan_id: razorpayPlanId }).eq("id", plan.id);
    }

    const subRes = await razorpayFetch("/subscriptions", razorpayKeyId, razorpayKeySecret, {
      method: "POST",
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        total_count: 120, // ~10 years of monthly cycles; Razorpay requires a count, this is effectively "until cancelled"
        notes: { numerologist_id: body.numerologist_id, plan_name: plan.name },
      }),
    });
    if (!subRes.ok) {
      const errText = await subRes.text();
      return new Response(JSON.stringify({ error: "Failed to create Razorpay subscription", details: errText.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const razorpaySub = await subRes.json();

    const { error: insertError } = await supabase.from("subscriptions").insert({
      numerologist_id: body.numerologist_id,
      plan_id: plan.id,
      status: "created",
      razorpay_subscription_id: razorpaySub.id,
    });
    if (insertError) console.error("DB insert error:", insertError.message);

    return new Response(JSON.stringify({
      success: true,
      subscription_id: razorpaySub.id,
      key_id: razorpayKeyId,
      plan_name: plan.name,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Edge function error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
