import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1,
  K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4,
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

const calculateNameValue = (name: string): number => {
  if (!name || typeof name !== 'string') return 0;
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, letter) => sum + (CHALDEAN_VALUES[letter] || 0), 0);
};

const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Math.floor(num / 10) + (num % 10);
  }
  return num;
};

interface ExternalName {
  name: string;
  gender: string;
  religion: string;
  meaning?: string;
  origin?: string;
}

const fetchNamesFromOpenAI = async (religion: string, gender: string, count: number): Promise<ExternalName[]> => {
  console.log(`[Enrichment] Generating ${count} ${gender} ${religion} names using OpenAI...`);

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    console.error('[Enrichment] OpenAI API key not configured');
    return [];
  }

  try {
    const prompt = `Generate ${count} authentic ${gender} baby names for ${religion} religion.
For each name, provide:
- name: The authentic name (without variations)
- meaning: The meaning of the name
- origin: The cultural/linguistic origin

Format as JSON array:
[{"name": "...", "meaning": "...", "origin": "..."}]

Requirements:
- Names must be culturally authentic and appropriate for ${religion}
- Include traditional and modern names
- Ensure names are suitable for ${gender} gender
- Provide meaningful, accurate meanings`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cultural naming expert with deep knowledge of baby names across all religions and cultures. Provide authentic, meaningful names with accurate cultural context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('[Enrichment] OpenAI API error:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Enrichment] Failed to parse OpenAI response');
      return [];
    }

    const generatedNames = JSON.parse(jsonMatch[0]);

    return generatedNames.map((n: { name: string; meaning: string; origin: string }) => ({
      name: n.name,
      gender,
      religion,
      meaning: n.meaning || 'A meaningful name',
      origin: n.origin || religion
    }));
  } catch (error) {
    console.error('[Enrichment] Error calling OpenAI:', error);
    return [];
  }
};

const fetchNamesFromExternal = async (): Promise<ExternalName[]> => {
  console.log('[Enrichment] Generating names from multiple sources...');

  const names: ExternalName[] = [];

  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jewish'];
  const genders = ['male', 'female'];

  for (const religion of religions) {
    for (const gender of genders) {
      const aiNames = await fetchNamesFromOpenAI(religion, gender, 10);
      names.push(...aiNames);
      console.log(`[Enrichment] Generated ${aiNames.length} ${gender} ${religion} names`);
    }
  }

  console.log(`[Enrichment] Total collected: ${names.length} names from AI`);
  return names;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Enrichment] Starting AI-powered name enrichment...');

    const externalNames = await fetchNamesFromExternal();

    let insertedCount = 0;
    let skippedCount = 0;

    for (const extName of externalNames) {
      const { data: existing } = await supabase
        .from('baby_names')
        .select('id')
        .eq('name', extName.name)
        .eq('gender', extName.gender)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      const compoundNumber = calculateNameValue(extName.name);
      const numerologyValue = reduceToSingleDigit(compoundNumber);

      const { error } = await supabase
        .from('baby_names')
        .insert({
          name: extName.name,
          gender: extName.gender,
          religion: extName.religion,
          meaning: extName.meaning || 'A meaningful name',
          origin: extName.origin || 'Unknown',
          compound_number: compoundNumber,
          numerology_value: numerologyValue,
          popularity_score: 50
        });

      if (error) {
        console.error(`[Enrichment] Error inserting ${extName.name}:`, error.message);
      } else {
        insertedCount++;
      }
    }

    console.log(`[Enrichment] Complete! Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedCount,
        skipped: skippedCount,
        total: externalNames.length
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error('[Enrichment] Error:', error);
    return new Response(
      JSON.stringify({
        error: "Enrichment failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
