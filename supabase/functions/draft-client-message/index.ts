import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Numerologist Assistant Agent (PRD Section 3, Phase 3). Helps a subscribed
numerologist draft the message they send a client alongside a generated
report, instead of writing it from scratch every time. The numerologist
reviews and edits before sending - this never sends anything itself.
Reuses the existing OPENAI_API_KEY/AI_MODEL_NAME secrets.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DraftMessageRequest {
  numerologistBusinessName: string;
  clientFirstName: string;
  driver: number;
  conductor: number;
  verdict?: string;
  tone?: "warm" | "formal" | "brief";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: DraftMessageRequest = await req.json();
    if (!body.clientFirstName || body.driver == null || body.conductor == null) {
      return new Response(JSON.stringify({ error: "Missing clientFirstName, driver, or conductor" }), {
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
    const tone = body.tone || "warm";
    const businessName = body.numerologistBusinessName || "your numerologist";

    const prompt = `Draft a short WhatsApp-style message from a numerologist named "${businessName}" to their client ${body.clientFirstName}, letting them know their numerology report is ready.

Facts to reference naturally (don't list them like a table):
- Driver number: ${body.driver}
- Conductor number: ${body.conductor}
${body.verdict ? `- Summary: ${body.verdict}` : ""}

Tone: ${tone}. Keep it under 60 words, sound like a real person texting, not a marketing blast. Sign off with the business name. No markdown, no emojis stacked more than 1.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "You draft short, natural-sounding client messages for small business owners. You never invent facts you weren't given." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 250,
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
    const message = (data.choices?.[0]?.message?.content || "").trim();
    if (!message) {
      return new Response(JSON.stringify({ error: "Empty response from AI provider" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in draft-client-message:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
