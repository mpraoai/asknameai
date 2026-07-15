import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { createClient } = await import("npm:@supabase/supabase-js@2.75.0");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const action = body.action;

    if (action === "send-otp") {
      const mobileNumber = body.mobile_number;
      if (!mobileNumber) {
        return new Response(JSON.stringify({ error: "Mobile number is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("otp_codes").update({ verified: true }).eq("mobile_number", mobileNumber).eq("verified", false);
      const { error: insertError } = await supabase.from("otp_codes").insert({ mobile_number: mobileNumber, code: otp, expires_at: expiresAt, verified: false });

      if (insertError) {
        return new Response(JSON.stringify({ error: "Failed to generate OTP" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, message: "OTP sent successfully", dev_otp: otp }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify-otp") {
      const mobileNumber = body.mobile_number;
      const otpCode = body.code;
      if (!mobileNumber || !otpCode) {
        return new Response(JSON.stringify({ error: "Mobile number and OTP code are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const now = new Date().toISOString();
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes").select("*").eq("mobile_number", mobileNumber).eq("code", otpCode).eq("verified", false)
        .order("created_at", { ascending: false }).limit(1).single();

      if (fetchError || !otpRecord) {
        return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (new Date(otpRecord.expires_at) < new Date(now)) {
        return new Response(JSON.stringify({ error: "OTP has expired. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("otp_codes").update({ verified: true }).eq("id", otpRecord.id);

      const emailFromMobile = `${mobileNumber.replace(/[^0-9]/g, '')}@asknameai.com`;
      const password = `AskNameAI_${mobileNumber.replace(/[^0-9]/g, '')}_2024`;

      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({ email: emailFromMobile, password, phone: mobileNumber, email_confirm: true });
      let userId: string;

      if (signUpError) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: emailFromMobile, password });
        if (signInError) {
          return new Response(JSON.stringify({ error: "Authentication failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        userId = signInData.user?.id ?? "";
      } else {
        userId = signUpData.user?.id ?? "";
      }

      await supabase.from("user_profiles").upsert({ auth_user_id: userId, mobile_number: mobileNumber, email: emailFromMobile, first_name: body.first_name || null, last_name: body.last_name || null }, { onConflict: 'auth_user_id' });

      const { data: sessionData } = await supabase.auth.signInWithPassword({ email: emailFromMobile, password });

      return new Response(JSON.stringify({ success: true, verified: true, user_id: userId, access_token: sessionData?.session?.access_token || null, refresh_token: sessionData?.session?.refresh_token || null, email: emailFromMobile }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use send-otp or verify-otp." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("OTP edge function error:", err.message || err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
