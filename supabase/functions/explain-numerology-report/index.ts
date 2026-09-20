import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Explainer Agent (PRD Section 3, Phase 3). The Analysis Agent
(src/lib/numerology.ts, unmodified) already produces the raw Driver/
Conductor/Life Path/etc numbers deterministically - this function's only
job is to turn those numbers into a personalized, plain-language reading,
the same OPENAI_API_KEY/AI_MODEL_NAME secrets already used by
generate-names-with-ai. The math can never be wrong here because this
function never touches it - it only narrates numbers it's handed.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExplainRequest {
  firstName: string;
  driver: number;
  conductor: number;
  lifePathNumber?: number;
  destinyNumber?: number;
  soulUrgeNumber?: number;
  isAuspicious?: boolean;
  maxWords?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ExplainRequest = await req.json();
    if (!body.firstName || body.driver == null || body.conductor == null) {
      return new Response(JSON.stringify({ error: "Missing firstName, driver, or conductor" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const modelName = Deno.env.get("AI_MODEL_NAME") || "gpt-4o-mini";
    const maxWords = Math.min(Math.max(body.maxWords || 150, 60), 250);

    const facts = [
      `Driver number: ${body.driver}`,
      `Conductor number: ${body.conductor}`,
      body.lifePathNumber != null ? `Life Path number: ${body.lifePathNumber}` : null,
      body.destinyNumber != null ? `Destiny number: ${body.destinyNumber}` : null,
      body.soulUrgeNumber != null ? `Soul Urge number: ${body.soulUrgeNumber}` : null,
      body.isAuspicious != null ? `Name/birth-date alignment: ${body.isAuspicious ? "auspicious" : "needs correction"}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `You are a warm, plain-English numerology guide writing directly to ${body.firstName}.

Here are their calculated numbers (already correct - do not recalculate or second-guess them):
${facts}

Write a personalized reading in under ${maxWords} words. Keep it warm, specific to these numbers (not generic astrology-speak), and easy to understand for someone with zero numerology background. Address them by first name once near the start. End with one encouraging, concrete takeaway sentence. Plain prose, no headings, no bullet points, no markdown.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "You are an expert numerologist who explains numbers in warm, simple, jargon-free language. You never invent or alter numbers you're given." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return new Response(JSON.stringify({ error: "AI provider error", details: errText.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await response.json()) as any;
    const explanation = (data.choices?.[0]?.message?.content || "").trim();
    if (!explanation) {
      return new Response(JSON.stringify({ error: "Empty response from AI provider" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-numerology-report:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
