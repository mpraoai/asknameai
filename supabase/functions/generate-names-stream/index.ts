import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StreamRequest {
  gender: "male" | "female";
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  count?: number;
  lastName?: string;
  excludeNames?: string[];
  keywords?: string;
  startingLetter?: string;
}

interface GeneratedName {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber: number;
  compatibilityScore: number;
  explanation: string;
}

const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1,
  K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4,
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

const calculateNameValue = (name: string): number => {
  if (!name || typeof name !== "string") return 0;
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .reduce((sum, letter) => sum + (CHALDEAN_VALUES[letter] || 0), 0);
};

const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Math.floor(num / 10) + (num % 10);
  }
  return num;
};

const FAVORABLE_NUMBERS = [1, 3, 5, 6];

const getAntiNumbers = (number: number): number[] => {
  const antiPairs: Record<number, number[]> = {
    1: [8], 2: [4, 9], 3: [6], 4: [2, 9], 5: [],
    6: [3], 7: [], 8: [1], 9: [2, 4],
  };
  return antiPairs[number] || [];
};

const getNumerologyDescription = (value: number, driver: number, conductor: number): string => {
  const descriptions: Record<number, string> = {
    1: "symbolizing new beginnings, leadership, and independence",
    3: "representing creativity, expression, and joyful energy",
    5: "reflecting freedom, adventure, and dynamic change",
    6: "embodying harmony, nurturing, and responsibility",
  };
  const baseDesc = descriptions[value] || "carrying auspicious energy";
  if (value === driver) {
    return `This name carries numerology value ${value}, ${baseDesc}, perfectly aligned with the Life Purpose ${driver}.`;
  } else if (value === conductor) {
    return `This name resonates with numerology value ${value}, ${baseDesc}, harmonizing beautifully with the Destiny ${conductor}.`;
  }
  return `This name embodies numerology value ${value}, ${baseDesc}, bringing favorable vibrations to the child's numerological profile.`;
};

const buildSingleNamePrompt = (req: StreamRequest, excludeNames: string[]): string => {
  const { gender, religion, driver, conductor, targetNumbers, keywords, startingLetter } = req;
  const genderText = gender === "male" ? "boy" : "girl";
  const religiousContext = religion.charAt(0).toUpperCase() + religion.slice(1);
  const antiToDriver = getAntiNumbers(driver);
  const antiToConductor = getAntiNumbers(conductor);
  const allAntiNumbers = [...new Set([...antiToDriver, ...antiToConductor])];

  return `You are an expert numerologist and baby name suggester. Generate exactly ONE unique, creative baby name for a ${genderText} following STRICT numerological principles.

Numerological Context:
- Gender: ${genderText}
- Religion/Culture: ${religiousContext}
- Driver Number (Life Purpose): ${driver}
- Conductor Number (Destiny): ${conductor}
- Target Numbers (Missing in Lo Shu Grid): [${targetNumbers.join(", ")}]
${keywords ? `- Desired style/keywords/vibe: ${keywords}` : ""}
${startingLetter ? `- Name MUST start with the letter: ${startingLetter.toUpperCase()}` : ""}

CRITICAL RULES:
1. Calculate the name's numerology value using the Chaldean system (A=1, B=2... I=9, J=1, K=2... Z=8), reduce to a single digit.
2. ONLY use names with values 1, 3, 5, or 6.
3. NEVER use value ${allAntiNumbers.length > 0 ? allAntiNumbers.join(" or ") : "none"} (anti to driver ${driver} or conductor ${conductor}).
4. Do NOT suggest any of these already-shown names: ${excludeNames.length > 0 ? excludeNames.join(", ") : "none"}.
5. The name must be authentic to ${religiousContext} culture, auspicious, and meaningful.
6. MEANING must be the actual etymological definition (e.g. "Light", "Brave lion"), not a generic adjective like "Virtuous" or "Pure".
7. EXPLANATION must be 25-50 words, unique, specific to this name's cultural/mythological context, and must NOT mention numerology numbers.

Return ONLY a single valid JSON object, no other text:
{
  "name": "ActualName",
  "meaning": "Brief etymological meaning",
  "numerologyValue": 3,
  "compatibilityScore": 95,
  "explanation": "Detailed 25-50 word unique explanation specific to this name..."
}`;
};

const buildGeneratedName = (
  raw: any,
  driver: number,
  conductor: number,
): GeneratedName | null => {
  const nameTrimmed = String(raw?.name || "").trim();
  if (!nameTrimmed) return null;

  const compoundNumber = calculateNameValue(nameTrimmed);
  const numerologyValue = reduceToSingleDigit(compoundNumber);

  if (!FAVORABLE_NUMBERS.includes(numerologyValue)) return null;
  const antiToDriver = getAntiNumbers(driver);
  const antiToConductor = getAntiNumbers(conductor);
  if (antiToDriver.includes(numerologyValue)) return null;
  if (antiToConductor.includes(numerologyValue)) return null;

  const aiExplanation = String(raw?.explanation || "").trim();
  const aiMeaning = String(raw?.meaning || "").trim() || "A meaningful name";
  const explanation = aiExplanation.length >= 40
    ? `${aiExplanation} - ${getNumerologyDescription(numerologyValue, driver, conductor)}`
    : `${aiMeaning} - ${getNumerologyDescription(numerologyValue, driver, conductor)}`;

  return {
    name: nameTrimmed,
    meaning: aiMeaning,
    numerologyValue,
    compoundNumber,
    compatibilityScore: Math.max(0, Math.min(100, parseInt(raw?.compatibilityScore, 10) || 75)),
    explanation,
  };
};

const generateOneName = async (
  apiKey: string,
  req: StreamRequest,
  excludeNames: string[],
): Promise<GeneratedName | null> => {
  const prompt = buildSingleNamePrompt(req, excludeNames);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert numerologist specializing in baby names. Always return exactly one valid JSON object as requested, with a detailed unique explanation of at least 25 words.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.85 + Math.random() * 0.3,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text());
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (!content) continue;

      const parsed = JSON.parse(content);
      const built = buildGeneratedName(parsed, req.driver, req.conductor);
      if (built && !excludeNames.some((n) => n.toLowerCase() === built.name.toLowerCase())) {
        return built;
      }
    } catch (error) {
      console.error("generateOneName attempt failed:", error);
    }
  }

  return null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST requests are supported" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: StreamRequest = await req.json();

    if (!body.gender || !body.religion || !body.driver || !body.conductor) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
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

    const count = Math.max(1, Math.min(body.count || 12, 24));
    const startTime = Date.now();
    const runningExcludeNames = [...(body.excludeNames || [])];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let delivered = 0;

        const runBatch = async (batchSize: number) => {
          const tasks = Array.from({ length: batchSize }).map(() =>
            generateOneName(apiKey, body, runningExcludeNames).then((name) => {
              if (name) {
                runningExcludeNames.push(name.name);
                delivered++;
                controller.enqueue(encoder.encode(JSON.stringify(name) + "\n"));
              }
            }).catch((error) => {
              console.error("Task failed:", error);
            })
          );
          await Promise.all(tasks);
        };

        await runBatch(count);

        // Backfill: if some slots failed (bad JSON, filtered numerology
        // value, etc.), top up with extra rounds instead of silently
        // under-delivering. Capped to avoid runaway cost/latency.
        let backfillRounds = 0;
        while (delivered < count && backfillRounds < 2) {
          const shortfall = count - delivered;
          await runBatch(shortfall);
          backfillRounds++;
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              done: true,
              metadata: { requested: count, delivered, executionTimeMs: Date.now() - startTime },
            }) + "\n",
          ),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "application/x-ndjson" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
