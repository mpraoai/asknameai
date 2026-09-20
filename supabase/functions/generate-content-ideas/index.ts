import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/*
Part II Phase D2 - organic content engine. Drafts a week of on-brand
social captions for a numerologist subscriber, grounded in their own
business name and niche. Reuses the same OPENAI_API_KEY / AI_MODEL_NAME
secrets already configured for generate-names-with-ai - no new
credentials needed. Never auto-publishes anything; the subscriber
copies a draft to their own Instagram/Facebook by hand (see II.2).
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateContentRequest {
  businessName: string;
  platform: "instagram" | "facebook" | "whatsapp_status" | "other";
  count?: number;
  focus?: string; // optional: an occasion or theme, e.g. "Diwali offer"
}

interface ContentDraft {
  caption: string;
  hashtags: string;
}

const buildPrompt = (req: GenerateContentRequest, count: number): string => {
  const focusLine = req.focus
    ? `Theme this batch around: ${req.focus}.`
    : "General numerology/name-correction awareness content - no specific occasion.";

  return `You are a social media copywriter for an Indian numerology consultant's business named "${req.businessName}".

Write ${count} short, on-brand ${req.platform} post captions that this numerologist can post under their own name to attract clients for name corrections, birth-date numerology readings, and baby naming consultations.

${focusLine}

Rules:
- Each caption is 2-4 sentences, warm and approachable, never fake-urgent or spammy.
- Reference real numerology concepts (Driver number, Conductor number, Lo Shu grid, name correction) naturally, not as jargon.
- Each caption ends with a soft call to action (e.g. "DM me your date of birth for a free reading" or "Comment your name below").
- Vary the angle across captions: one educational, one testimonial-style (no fake names/quotes - describe a general pattern instead), one myth-busting, one seasonal/relatable, etc.
- No emojis stacked more than 2 per caption. No ALL CAPS. No exclamation-mark spam.

Return ONLY a valid JSON array, no other text:
[
  { "caption": "...", "hashtags": "#numerology #nameanalysis ..." }
]`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GenerateContentRequest = await req.json();
    if (!body.businessName || !body.platform) {
      return new Response(JSON.stringify({ error: "Missing businessName or platform" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelName = Deno.env.get("AI_MODEL_NAME") || "gpt-4o-mini";
    const count = Math.min(Math.max(body.count || 5, 1), 7);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "You are a precise, on-brand social media copywriter. Always return valid JSON arrays exactly as requested, no markdown fences, no extra text.",
          },
          { role: "user", content: buildPrompt(body, count) },
        ],
        max_completion_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return new Response(JSON.stringify({ error: "AI provider error", details: errText.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const drafts = JSON.parse(jsonMatch[0]) as ContentDraft[];
    const cleaned = drafts
      .map((d) => ({
        caption: String(d.caption || "").trim(),
        hashtags: String(d.hashtags || "").trim(),
      }))
      .filter((d) => d.caption.length > 0)
      .slice(0, count);

    return new Response(JSON.stringify({ success: true, drafts: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-content-ideas:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
