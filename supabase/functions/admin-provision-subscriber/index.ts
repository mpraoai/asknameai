import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Real "Grant system access" for the ops console's New Subscriber wizard.
Runs with the service role so it can create a real Supabase Auth user
(regular clients can't do this) and set up everything else the wizard
promises in one action: user_profiles + numerologist_profiles (same
password-is-the-mobile-number convention as authService.ts's
registerUser, and the same on_auth_user_created trigger populates
user_profiles from the metadata below - this function never touches
authService.ts itself), subscriber_modules, a contract, and a first
invoice.

Caller must already be an admin - verified against the caller's own
JWT before anything is created.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProvisionRequest {
  first_name: string;
  last_name?: string;
  business_name: string;
  mobile_number: string;
  email: string;
  plan_id: string;
  module_codes: string[]; // add-on modules only, numerology is always included
}

async function getServiceClient() {
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
}

async function getCallerIsAdmin(req: Request, anon: any): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
  const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const { data } = await anon.from("user_profiles").select("is_admin").eq("auth_user_id", user.id).maybeSingle();
  return !!data?.is_admin;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = await getServiceClient();
    const isAdmin = await getCallerIsAdmin(req, supabase);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ProvisionRequest = await req.json();
    if (!body.first_name || !body.business_name || !body.mobile_number || !body.email || !body.plan_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingProfile } = await supabase
      .from("user_profiles").select("id").eq("mobile_number", body.mobile_number).maybeSingle();
    if (existingProfile) {
      return new Response(JSON.stringify({ error: "A user with this mobile number already exists" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Real auth user - same password-is-mobile-number convention as authService.ts registerUser().
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.mobile_number,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name || "",
        mobile_number: body.mobile_number,
      },
    });
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: authError?.message || "Could not create auth user" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The on_auth_user_created trigger creates user_profiles from the metadata above.
    // Poll briefly since it fires asynchronously on insert.
    let userProfile: { id: string } | null = null;
    for (let i = 0; i < 10 && !userProfile; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const { data } = await supabase.from("user_profiles").select("id").eq("auth_user_id", authData.user.id).maybeSingle();
      userProfile = data;
    }
    if (!userProfile) {
      return new Response(JSON.stringify({ error: "Auth user created but profile row never appeared" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Promote to numerologist + create numerologist_profiles.
    await supabase.from("user_profiles").update({ role: "numerologist" }).eq("id", userProfile.id);
    const { data: plan } = await supabase.from("subscription_plans").select("id, name, price_monthly_inr, reports_limit_per_month").eq("id", body.plan_id).maybeSingle();
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: numerologistProfile, error: npError } = await supabase
      .from("numerologist_profiles")
      .insert({
        user_profile_id: userProfile.id,
        business_name: body.business_name,
        subscription_status: "active",
        reports_limit_per_month: plan.reports_limit_per_month,
      })
      .select("id").single();
    if (npError || !numerologistProfile) {
      return new Response(JSON.stringify({ error: npError?.message || "Could not create numerologist profile" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const numerologistId = numerologistProfile.id;

    // 3. Modules - numerology is core/always on; add the selected paid modules.
    const { data: modules } = await supabase.from("platform_modules").select("code, monthly_price_inr").in("code", ["numerology", ...body.module_codes]);
    const moduleRows = ["numerology", ...body.module_codes].map((code) => ({ numerologist_id: numerologistId, module_code: code, is_enabled: true }));
    await supabase.from("subscriber_modules").upsert(moduleRows, { onConflict: "numerologist_id,module_code" });

    // plan.price_monthly_inr is stored in paise (Razorpay convention, shared
    // with the payments table); platform_modules prices are plain rupees.
    // Convert the plan to rupees so this total is one consistent unit.
    const planBaseRupees = Math.round(plan.price_monthly_inr / 100);
    const addOnTotal = (modules || []).filter((m) => body.module_codes.includes(m.code)).reduce((sum, m) => sum + m.monthly_price_inr, 0);
    const monthlyTotal = planBaseRupees + addOnTotal;

    // 4. Contract.
    const { data: contract } = await supabase.from("contracts").insert({
      numerologist_id: numerologistId,
      plan_id: plan.id,
      modules: body.module_codes,
      monthly_total_inr: monthlyTotal,
      status: "sent",
      sent_at: new Date().toISOString(),
    }).select("id").single();

    // 5. First invoice.
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItems = [
      { label: `${plan.name} plan base`, amount_inr: planBaseRupees },
      ...(modules || []).filter((m) => body.module_codes.includes(m.code)).map((m) => ({ label: m.code, amount_inr: m.monthly_price_inr })),
    ];
    await supabase.from("invoices").insert({
      numerologist_id: numerologistId,
      contract_id: contract?.id || null,
      invoice_number: invoiceNumber,
      line_items: lineItems,
      total_inr: monthlyTotal,
      status: "sent",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });

    return new Response(JSON.stringify({
      success: true,
      numerologist_id: numerologistId,
      monthly_total_inr: monthlyTotal,
      invoice_number: invoiceNumber,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Provisioning error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
