import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Lead Triage Agent (v2)
 *
 * Assigns an AI-generated 0-100 score to a lead, stored in the new
 * `score_numeric` column. Deliberately does NOT touch the existing
 * `lead_score` field (hot/warm/cold) — that's still owned by the existing
 * client-side leadScoringAgent.ts rules engine. The two scores run side by
 * side on purpose, so it's possible to compare which one is more useful
 * before deciding whether to consolidate them later.
 *
 * Additive only: only reads/writes the leads/agent_logs tables. Does not
 * touch the numerology engine, the baby-name agents, or razorpay-payment.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .maybeSingle();

    if (fetchError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a short, factual description of the lead for the model —
    // no invented details, only what was actually captured.
    const signals = [
      `source_type: ${lead.source_type}`,
      `has_email: ${Boolean(lead.email)}`,
      `has_mobile: ${Boolean(lead.mobile_number)}`,
      `has_name: ${Boolean(lead.first_name && lead.last_name)}`,
      `existing_rule_based_lead_score: ${lead.lead_score ?? "not set"}`,
    ].join(", ");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    let score = 40;
    let reasoning = "Default score — AI scoring unavailable.";

    if (apiKey) {
      const aiModel = Deno.env.get("AI_MODEL_NAME") || "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: "system",
              content:
                "You score inbound leads for a numerology SaaS from 0-100 based only on the signals given. " +
                "Higher = more likely to book a paid consultation (complete contact info, came from an " +
                "engaged source like the baby-name tool, not just an anonymous free check). " +
                "You're also given an existing rule-based hot/warm/cold tier for context — you don't need " +
                "to match it, this is a separate, independent score. " +
                "Reply as strict JSON: {\"score\": number, \"reasoning\": string}. Reasoning under 30 words.",
            },
            { role: "user", content: `Lead signals: ${signals}` },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        try {
          const parsed = JSON.parse(result.choices[0].message.content);
          score = Math.max(0, Math.min(100, Math.round(parsed.score)));
          reasoning = parsed.reasoning;
        } catch {
          // Keep the safe default above if the model's output isn't valid JSON.
        }
      }
    }

    // Only score_numeric is written here — lead_score (hot/warm/cold) stays
    // owned by the existing leadScoringAgent.ts rules engine, untouched.
    const { error: updateError } = await supabase
      .from("leads")
      .update({ score_numeric: score })
      .eq("id", lead_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("agent_logs").insert({
      agent_name: "triage_agent",
      lead_id,
      input: { signals },
      output: { score_numeric: score, reasoning },
    });

    return new Response(
      JSON.stringify({ score_numeric: score, reasoning }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
