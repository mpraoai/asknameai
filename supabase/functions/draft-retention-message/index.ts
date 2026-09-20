import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Retention Agent (PRD Section 3, Phase 3). Drafts a win-back / follow-up
message for a lead that's gone quiet, for the numerologist to review and
send by hand - there's no outbound WhatsApp/email integration in this app
yet, so this deliberately stops at "draft a message a human sends," not
"send it automatically." Reuses the existing OPENAI_API_KEY/AI_MODEL_NAME
secrets.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DraftRetentionRequest {
  leadFirstName: string;
  daysSinceContact: number;
  leadStatus: string;
  numerologistBusinessName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: DraftRetentionRequest = await req.json();
    if (!body.leadFirstName || body.daysSinceContact == null) {
      return new Response(JSON.stringify({ error: "Missing leadFirstName or daysSinceContact" }), {
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
    const businessName = body.numerologistBusinessName || "your numerologist";

    const prompt = `Draft a short, friendly WhatsApp-style follow-up message from a numerologist named "${businessName}" to a lead named ${body.leadFirstName}, who got a free numerology check ${body.daysSinceContact} day(s) ago but hasn't responded since (current status: "${body.leadStatus}").

Goal: gently re-open the conversation and offer to send their full reading - not pushy, no fake urgency, no discount unless it sounds natural. Under 50 words. Sign off with the business name.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "You draft short, natural, non-pushy re-engagement messages for a small business owner following up on a quiet lead." },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 200,
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
    console.error("Error in draft-retention-message:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
