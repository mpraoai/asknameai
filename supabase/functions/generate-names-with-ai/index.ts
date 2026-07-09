import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateNamesRequest {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  count?: number;
  lastName?: string;
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
  U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

const calculateNameValue = (name: string): number => {
  if (!name || typeof name !== 'string') {
    return 0;
  }
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, letter) => {
      return sum + (CHALDEAN_VALUES[letter] || 0);
    }, 0);
};

const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Math.floor(num / 10) + (num % 10);
  }
  return num;
};

const FAVORABLE_NUMBERS = [1, 3, 5, 6];
const FORBIDDEN_COMPOUNDS = [44, 48, 28, 18, 36];

const calculateCombinedName = (firstName: string, lastName: string) => {
  const firstNameTotal = calculateNameValue(firstName);
  const lastNameTotal = calculateNameValue(lastName);
  const combinedTotal = firstNameTotal + lastNameTotal;
  const combinedReduced = reduceToSingleDigit(combinedTotal);

  const isValid = FAVORABLE_NUMBERS.includes(combinedReduced) &&
                  !FORBIDDEN_COMPOUNDS.includes(combinedTotal);

  return { isValid, combinedTotal, combinedReduced };
};

const filterNamesByLastName = (names: GeneratedName[], lastName: string): GeneratedName[] => {
  if (!lastName) return names;

  return names.filter(nameObj => {
    const result = calculateCombinedName(nameObj.name, lastName);
    return result.isValid;
  });
};

const getNumerologyDescription = (value: number, driver: number, conductor: number): string => {
  const descriptions: Record<number, string> = {
    1: "symbolizing new beginnings, leadership, and independence",
    3: "representing creativity, expression, and joyful energy",
    5: "reflecting freedom, adventure, and dynamic change",
    6: "embodying harmony, nurturing, and responsibility"
  };

  const baseDesc = descriptions[value] || "carrying auspicious energy";

  if (value === driver) {
    return `This name carries numerology value ${value}, ${baseDesc}, perfectly aligned with the Life Purpose ${driver}.`;
  } else if (value === conductor) {
    return `This name resonates with numerology value ${value}, ${baseDesc}, harmonizing beautifully with the Destiny ${conductor}.`;
  } else {
    return `This name embodies numerology value ${value}, ${baseDesc}, bringing favorable vibrations to the child's numerological profile.`;
  }
};

const getAntiNumbers = (number: number): number[] => {
  const antiPairs: Record<number, number[]> = {
    1: [8],
    2: [4, 9],
    3: [6],
    4: [2, 9],
    5: [],
    6: [3],
    7: [],
    8: [1],
    9: [2, 4]
  };
  return antiPairs[number] || [];
};

const buildNumerologyPrompt = (
  req: GenerateNamesRequest,
  count: number = 25
): string => {
  const { gender, religion, driver, conductor, targetNumbers, loshuGrid } = req;
  const genderText = gender === 'male' ? 'boy' : 'girl';
  const religiousContext = `${religion.charAt(0).toUpperCase() + religion.slice(1)}`;

  const antiToDriver = getAntiNumbers(driver);
  const antiToConductor = getAntiNumbers(conductor);
  const allAntiNumbers = [...new Set([...antiToDriver, ...antiToConductor])];

  return `You are an expert numerologist and baby name suggester. Generate ${count} unique baby names for a ${genderText} following STRICT numerological principles.

Numerological Context:
- Gender: ${genderText}
- Religion/Culture: ${religiousContext}
- Driver Number (Life Purpose): ${driver}
- Conductor Number (Destiny): ${conductor}
- Target Numbers (Missing in Lo Shu Grid): [${targetNumbers.join(', ')}]
- Lo Shu Grid Configuration: ${JSON.stringify(loshuGrid)}

CRITICAL RULES - ABSOLUTE REQUIREMENTS:
1. Calculate each name's numerology value using the Chaldean system (A=1, B=2... I=9, J=1, K=2... Z=8)
2. Reduce to single digit by adding digits (e.g., 25 = 2+5 = 7)
3. ONLY SUGGEST NAMES WITH VALUES: 1, 3, 5, or 6 (these are the ONLY favorable numbers)
4. NEVER suggest names with numerology value 2, 4, 7, 8, or 9
5. NEVER suggest names with value ${allAntiNumbers.length > 0 ? allAntiNumbers.join(' or ') : 'none'} (anti to driver ${driver} or conductor ${conductor})
6. Prioritize names with values: ${targetNumbers.length > 0 ? targetNumbers.filter(n => [1, 3, 5, 6].includes(n)).join(', ') : '1, 3, 5, 6'}
7. All names must be: auspicious, culturally appropriate, and meaningful
8. MEANING FIELD: MUST be the ACTUAL etymological definition from Arabic/Sanskkrit/Hebrew/etc. Examples of CORRECT meanings: "Light", "Brave lion", "Gift from God", "Beautiful flower", "Wise ruler". Examples of WRONG meanings (DO NOT USE): "Virtuous", "Honorable", "Radiant", "Pure", "Noble" - these are generic adjectives, NOT etymological meanings

Anti-Number Relationships (CRITICAL - DO NOT VIOLATE):
- 1 and 8 are enemies (Sun vs Saturn)
- 2 and 4, 2 and 9 are enemies (Moon vs Rahu/Mars)
- 3 and 6 are enemies (Jupiter vs Venus)
- 4 and 2, 4 and 9 are enemies (Rahu vs Moon/Mars)
- 6 and 3 are enemies (Venus vs Jupiter)
- 9 and 2, 9 and 4 are enemies (Mars vs Moon/Rahu)

DRIVER ${driver} CANNOT HAVE: ${antiToDriver.length > 0 ? antiToDriver.join(', ') : 'none'}
CONDUCTOR ${conductor} CANNOT HAVE: ${antiToConductor.length > 0 ? antiToConductor.join(', ') : 'none'}

For each name, you MUST provide ALL fields:
1. Name (authentic to ${religiousContext} culture)
2. Meaning (2-4 words explaining the significance)
3. Numerology Value (MUST BE 1, 3, 5, or 6 ONLY)
4. Compatibility Score (0-100, how well it matches the requirements)
5. Explanation (ABSOLUTELY MANDATORY - THIS IS THE MOST IMPORTANT FIELD):
   - MINIMUM 25-50 words for EVERY SINGLE NAME WITHOUT EXCEPTION
   - MUST be completely unique - never reuse text between names
   - MUST explain what THIS SPECIFIC name means in its cultural context
   - MUST describe why THIS PARTICULAR name is significant
   - MUST mention specific deity/tradition/virtue/attribute for THIS NAME
   - Include historical or mythological context when possible
   - Talk about what makes THIS name special and distinctive
   - DO NOT use vague phrases like \"carries significance\" or \"culturally important\"
   - DO NOT use the same sentence structure for multiple names
   - DO NOT leave this field empty or short
   - DO NOT mention numerology numbers in this field

ABSOLUTE REQUIREMENT - NO EXCEPTIONS:
Every single name MUST have a completely unique, detailed explanation that is specific to that name's meaning, origin, and cultural significance. If I see even ONE generic explanation, ONE missing explanation, or ONE explanation that could apply to any name, I will reject the entire response. Each name's explanation should read like a mini-encyclopedia entry about THAT SPECIFIC name.

Return ONLY valid JSON array with no additional text. EVERY name needs a unique explanation like these examples:

Example for \"Krishna\": \"This name honors Lord Krishna, the eighth avatar of Vishnu in Hindu tradition, known for his divine playfulness and profound wisdom. It represents divine love and protection, deeply revered in Indian culture.\"

Example for \"Anaya\": \"This name signifies compassion and care, rooted in Sanskrit meaning 'completely free' or 'without a superior'. It represents a caring guardian and protector, highly valued in Hindu tradition for its gentle yet powerful feminine energy.\"

Format:
[
  {
    \"name\": \"ActualName\",
    \"meaning\": \"Brief meaning\",
    \"numerologyValue\": 3,
    \"compatibilityScore\": 95,
    \"explanation\": \"Detailed 25-50 word unique explanation specific to this name...\"
  }
]

Generate exactly ${count} unique names. STRICT JSON format only. VERIFY each name's numerology value before including it. Use diverse and varied names to ensure uniqueness.`;
};

const isGenericExplanation = (explanation: string): boolean => {
  const genericPhrases = [
    'carries significant cultural',
    'significant cultural and numerological importance',
    'culturally important',
    'holds cultural significance',
    'important in culture',
    'valued in tradition',
    'carries significance',
    'holds significance',
    'cultural and numerological importance',
    'traditional significance',
    'carries profound significance'
  ];

  const lowerExplanation = explanation.toLowerCase();
  return genericPhrases.some(phrase => lowerExplanation.includes(phrase));
};

const generateDetailedExplanation = (
  nameTrimmed: string,
  aiMeaning: string,
  correctNumerologyValue: number,
  driver: number,
  conductor: number,
  religion: string
): string => {
  const numerologyExplanation = getNumerologyDescription(correctNumerologyValue, driver, conductor);
  const nameHash = nameTrimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const meaningLower = (aiMeaning || '').toLowerCase();
  const religionLower = religion.toLowerCase();

  if (aiMeaning && aiMeaning.length > 3) {
    let templates: string[] = [];

    if (religionLower === 'hindu') {
      templates = [
        `${nameTrimmed} translates to '${meaningLower}', embodying a virtue celebrated in Hindu philosophy and scripture. This name appears in ancient texts like the Vedas and Puranas, carried by sages and deities who exemplified its meaning. Parents choosing ${nameTrimmed} connect their child to this spiritual heritage, selecting a name that resonates with dharmic values and timeless wisdom. ${numerologyExplanation}`,

        `In Sanskrit tradition, ${nameTrimmed} means '${meaningLower}', representing a quality revered in Hindu culture. The name has adorned heroes of the epics, celestial beings, and spiritual teachers throughout Indian history. Families who select ${nameTrimmed} honor these traditions, bestowing upon their child a designation rich with mythological and cultural significance that spans millennia. ${numerologyExplanation}`,

        `The name ${nameTrimmed}, signifying '${meaningLower}', holds deep resonance in Hindu communities. Found in classical literature from the Ramayana to the Mahabharata, this name embodies ideals that parents hope to nurture in their children. ${nameTrimmed} represents a connection to ancient wisdom, carrying forward values that have guided countless generations in their spiritual and worldly pursuits. ${numerologyExplanation}`,

        `${nameTrimmed} carries the beautiful meaning of '${meaningLower}', a concept woven into Hindu teachings and philosophy. This name appears in devotional poetry, sacred mantras, and historical accounts of notable figures who shaped Indian spiritual thought. Parents selecting ${nameTrimmed} offer their child a name that bridges the divine and earthly, reflecting aspirations rooted in dharmic principles. ${numerologyExplanation}`,

        `Derived from Sanskrit, ${nameTrimmed} means '${meaningLower}', capturing an attribute valued in Hindu tradition. The name resonates with stories of gods, goddesses, and enlightened souls who embodied these qualities. Families choosing ${nameTrimmed} participate in a naming tradition thousands of years old, connecting their child to cultural and spiritual roots that continue to inspire. ${numerologyExplanation}`,

        `${nameTrimmed}, meaning '${meaningLower}', exemplifies how Hindu names carry layers of spiritual significance. This designation may reference divine attributes, natural elements, or virtuous qualities praised in scriptures. Parents who choose ${nameTrimmed} give their child a name that serves as both identity and aspiration, rooted in philosophy that values character and consciousness. ${numerologyExplanation}`,

        `The Sanskrit name ${nameTrimmed} translates as '${meaningLower}', embodying ideals central to Hindu worldview. Throughout history, bearers of this name have included saints, scholars, and leaders who reflected its meaning through their lives. Selecting ${nameTrimmed} represents a thoughtful choice, honoring tradition while celebrating the unique potential of a new soul. ${numerologyExplanation}`,

        `${nameTrimmed} signifies '${meaningLower}', representing virtues praised in Hindu sacred texts and cultural wisdom. The name connects to a rich heritage of mythology, philosophy, and devotional practice. Families choosing ${nameTrimmed} offer their child a designation that carries spiritual weight, linking personal identity to concepts that transcend time and remain eternally relevant. ${numerologyExplanation}`
      ];
    } else if (religionLower === 'muslim') {
      templates = [
        `${nameTrimmed} translates to '${meaningLower}', embodying a quality deeply admired in Islamic tradition. The name bears witness to virtues exemplified by historical figures who carried this designation with honor. Parents who select ${nameTrimmed} aspire to see these noble traits flourish in their child, making it a powerful choice that connects past wisdom with future hopes. ${numerologyExplanation}`,

        `In Arabic tradition, ${nameTrimmed} means '${meaningLower}', representing an attribute celebrated throughout Islamic history. This name has graced scholars, leaders, and spiritual guides across centuries. Families choosing ${nameTrimmed} honor this legacy, selecting a name that carries both linguistic beauty and substantive character, ensuring their child bears a designation of lasting significance. ${numerologyExplanation}`,

        `The name ${nameTrimmed}, signifying '${meaningLower}', holds special resonance in Muslim communities worldwide. Its melodious sound is matched by profound meaning, reflecting qualities parents hope to instill from birth. ${nameTrimmed} appears in classical texts and historical records, testifying to its enduring appeal and the timeless virtues it represents across generations. ${numerologyExplanation}`,

        `${nameTrimmed} carries the beautiful meaning of '${meaningLower}', a concept woven into the fabric of Islamic culture. Those bearing this name inherit a tradition of excellence and character. The selection of ${nameTrimmed} reflects parental aspirations for their child to embody the very qualities this name celebrates, creating a lifelong connection to noble ideals. ${numerologyExplanation}`,

        `Derived from Arabic roots, ${nameTrimmed} means '${meaningLower}', capturing an essential quality valued in Islamic teachings. The name's historical usage spans continents and centuries, appearing among notable figures who shaped Muslim heritage. Parents selecting ${nameTrimmed} bestow not merely a label but an identity rich with meaning and cultural depth. ${numerologyExplanation}`,

        `${nameTrimmed}, meaning '${meaningLower}', exemplifies how Islamic names blend sound with significance. This designation appears in classical poetry, historical chronicles, and religious texts, each reference adding layers of meaning. Families who choose ${nameTrimmed} connect their child to this rich tapestry, offering a name that resonates with both beauty and substance. ${numerologyExplanation}`,

        `The Arabic name ${nameTrimmed} translates as '${meaningLower}', embodying virtues central to Islamic character building. Throughout history, bearers of this name have been noted for qualities that reflect its meaning. Parents who select ${nameTrimmed} make a deliberate choice to honor tradition while celebrating their child's unique journey and potential. ${numerologyExplanation}`,

        `${nameTrimmed} signifies '${meaningLower}' in Arabic, representing more than mere definition—it captures an ideal. The name's usage across diverse Muslim cultures, from Arabia to South Asia, testifies to its universal appeal. Choosing ${nameTrimmed} means gifting a child with a name that carries weight, history, and the promise of admirable character traits. ${numerologyExplanation}`
      ];
    } else if (religionLower === 'christian') {
      templates = [
        `${nameTrimmed} translates to '${meaningLower}', embodying a virtue cherished in Christian tradition. The name may appear in Biblical narratives or reflect qualities praised in scripture, connecting the bearer to centuries of faith and devotion. Parents selecting ${nameTrimmed} choose a name that carries spiritual significance, representing values and character traits they hope to nurture in their child. ${numerologyExplanation}`,

        `In Christian tradition, ${nameTrimmed} means '${meaningLower}', representing an attribute valued throughout the faith's history. This name has been borne by saints, martyrs, and faithful servants who exemplified its meaning. Families choosing ${nameTrimmed} honor this legacy, selecting a designation that connects their child to a community of believers spanning two millennia. ${numerologyExplanation}`,

        `The name ${nameTrimmed}, signifying '${meaningLower}', holds special meaning in Christian communities. Found in Biblical texts or church history, this name embodies ideals that align with teachings of faith, hope, and love. ${nameTrimmed} represents both personal identity and spiritual aspiration, chosen by parents who value names with depth and religious significance. ${numerologyExplanation}`,

        `${nameTrimmed} carries the beautiful meaning of '${meaningLower}', a concept woven into Christian teachings and practice. The name resonates with scriptural wisdom and may reference Biblical figures or virtues praised in the gospels. Parents selecting ${nameTrimmed} offer their child a name that bridges earthly life and spiritual calling, reflecting their faith and values. ${numerologyExplanation}`,

        `Rooted in Christian heritage, ${nameTrimmed} means '${meaningLower}', capturing a quality valued in the faith. The name's usage spans centuries of church history, appearing among those who dedicated their lives to service and devotion. Families choosing ${nameTrimmed} participate in a naming tradition that views names as blessings, connecting their child to a legacy of faith. ${numerologyExplanation}`,

        `${nameTrimmed}, meaning '${meaningLower}', exemplifies how Christian names carry spiritual significance. This designation may honor saints, Biblical characters, or embody virtues taught in scripture. Parents who choose ${nameTrimmed} give their child a name that serves as both identity and reminder of the values they hope to instill. ${numerologyExplanation}`,

        `The name ${nameTrimmed} translates as '${meaningLower}', embodying ideals central to Christian life. Throughout history, bearers of this name have included faithful witnesses, church leaders, and ordinary believers who reflected its meaning. Selecting ${nameTrimmed} represents a meaningful choice, honoring tradition while celebrating new life as a gift from God. ${numerologyExplanation}`,

        `${nameTrimmed} signifies '${meaningLower}', representing qualities praised in Christian teaching and practice. The name connects to a heritage of faith, carrying associations with Biblical narratives or church tradition. Families choosing ${nameTrimmed} offer their child a designation that speaks to their spiritual hopes and the character they wish to nurture. ${numerologyExplanation}`
      ];
    } else if (religionLower === 'sikh') {
      templates = [
        `${nameTrimmed} translates to '${meaningLower}', embodying a quality valued in Sikh philosophy and tradition. The name reflects virtues taught in the Guru Granth Sahib, emphasizing courage, devotion, and righteousness. Parents choosing ${nameTrimmed} connect their child to Sikh heritage, selecting a name that resonates with principles of equality, service, and spiritual strength. ${numerologyExplanation}`,

        `In Sikh tradition, ${nameTrimmed} means '${meaningLower}', representing an attribute celebrated in the community. This name carries associations with the warrior-saint ideal, embodying both spiritual devotion and worldly courage. Families selecting ${nameTrimmed} honor Sikh values, bestowing a name that reflects the teachings of the Gurus and the spirit of the Khalsa. ${numerologyExplanation}`,

        `The name ${nameTrimmed}, signifying '${meaningLower}', holds special resonance in Sikh communities. It embodies qualities that align with Sikh principles of truth, compassion, and fearlessness. ${nameTrimmed} represents a connection to Punjabi culture and Sikh spiritual heritage, chosen by parents who value names that carry both strength and devotion. ${numerologyExplanation}`,

        `${nameTrimmed} carries the beautiful meaning of '${meaningLower}', a concept woven into Sikh teachings. The name reflects values emphasized in gurbani and the examples set by the ten Gurus. Parents selecting ${nameTrimmed} offer their child a name that honors Sikh tradition while celebrating the unique potential of each soul as part of the divine. ${numerologyExplanation}`,

        `Rooted in Sikh heritage, ${nameTrimmed} means '${meaningLower}', capturing an attribute valued in the faith. The name resonates with stories of courage, sacrifice, and devotion that define Sikh history. Families choosing ${nameTrimmed} participate in a naming tradition that views names as reflections of character and spiritual aspiration. ${numerologyExplanation}`,

        `${nameTrimmed}, meaning '${meaningLower}', exemplifies how Sikh names carry spiritual and cultural significance. This designation reflects qualities praised in the Guru Granth Sahib and embodied by the Sikh community. Parents who choose ${nameTrimmed} give their child a name that honors the legacy of the Gurus while looking forward to a life of purpose and devotion. ${numerologyExplanation}`,

        `The Punjabi name ${nameTrimmed} translates as '${meaningLower}', embodying ideals central to Sikh identity. Throughout history, Sikhs bearing similar names have exemplified courage, service, and unwavering faith. Selecting ${nameTrimmed} represents a meaningful choice that connects the child to Sikh values of equality, justice, and spiritual seeking. ${numerologyExplanation}`,

        `${nameTrimmed} signifies '${meaningLower}', representing virtues that resonate with Sikh teachings. The name carries the spirit of Chardi Kala—eternal optimism and strength in the face of adversity. Families choosing ${nameTrimmed} offer their child a designation rooted in a tradition that values both spiritual devotion and active engagement with the world. ${numerologyExplanation}`
      ];
    } else {
      templates = [
        `${nameTrimmed} translates to '${meaningLower}', embodying a quality admired across cultures and traditions. The name carries timeless appeal, reflecting virtues that parents hope to see flourish in their child. ${nameTrimmed} represents a thoughtful choice that honors heritage while celebrating individual potential and character. ${numerologyExplanation}`,

        `The name ${nameTrimmed} means '${meaningLower}', representing an attribute valued universally. This designation has been chosen by families across different cultures and times, each finding resonance in its meaning. Parents selecting ${nameTrimmed} offer their child a name that carries both significance and beauty, suitable for any path in life. ${numerologyExplanation}`,

        `${nameTrimmed}, signifying '${meaningLower}', holds special meaning for families who choose it. The name reflects qualities that transcend cultural boundaries—virtues appreciated in diverse traditions worldwide. ${nameTrimmed} represents both personal identity and parental aspiration, a meaningful choice for a child's lifelong designation. ${numerologyExplanation}`,

        `${nameTrimmed} carries the beautiful meaning of '${meaningLower}', a concept that resonates across cultures. Parents who select this name appreciate its linguistic grace and the ideals it represents. ${nameTrimmed} offers a child a designation that combines heritage with timeless appeal, embodying qualities valued in many traditions. ${numerologyExplanation}`
      ];
    }

    return templates[nameHash % templates.length];
  }

  let fallbackTemplates: string[] = [];

  if (religionLower === 'hindu') {
    fallbackTemplates = [
      `${nameTrimmed} is a name with distinguished roots in Hindu tradition, appearing in ancient texts and spiritual literature. The name's usage across diverse Indian regions testifies to its broad appeal and cultural significance. Parents who select ${nameTrimmed} choose a designation that connects their child to centuries of dharmic heritage while offering a timeless quality that remains relevant today. ${numerologyExplanation}`,

      `The name ${nameTrimmed} carries weight in Sanskrit naming conventions, having been borne by notable figures throughout Indian history. Its selection reflects parental values and aspirations for their child's spiritual and worldly development. ${nameTrimmed} offers both cultural authenticity and contemporary relevance, making it a thoughtful choice for families honoring tradition. ${numerologyExplanation}`,

      `${nameTrimmed} stands among names that have shaped Hindu cultural identity across generations. The designation appears in mythology, devotional literature, and historical records, each mention adding to its rich legacy. Families choosing ${nameTrimmed} participate in this ongoing tradition, bestowing upon their child a name of substance and spiritual resonance. ${numerologyExplanation}`
    ];
  } else if (religionLower === 'muslim') {
    fallbackTemplates = [
      `${nameTrimmed} is a name with distinguished roots in Islamic tradition, appearing in historical records and classical texts. The name's usage across diverse Muslim regions testifies to its broad appeal and cultural significance. Parents who select ${nameTrimmed} choose a designation that connects their child to centuries of heritage while offering a timeless quality that remains relevant today. ${numerologyExplanation}`,

      `The name ${nameTrimmed} carries weight in Arabic naming conventions, having been borne by notable figures throughout Islamic history. Its selection reflects parental values and aspirations for their child's character development. ${nameTrimmed} offers both cultural authenticity and contemporary relevance, making it a thoughtful choice for families honoring tradition. ${numerologyExplanation}`,

      `${nameTrimmed} stands among names that have shaped Muslim cultural identity across generations. The designation appears in literature, historical chronicles, and community records, each mention adding to its rich legacy. Families choosing ${nameTrimmed} participate in this ongoing tradition, bestowing upon their child a name of substance and historical resonance. ${numerologyExplanation}`
    ];
  } else {
    fallbackTemplates = [
      `${nameTrimmed} is a name with cultural roots that resonate across traditions. The name's usage by families from diverse backgrounds testifies to its broad appeal and significance. Parents who select ${nameTrimmed} choose a designation that honors their heritage while offering a timeless quality suitable for any cultural context. ${numerologyExplanation}`,

      `The name ${nameTrimmed} carries significance across cultural naming traditions. Its selection reflects parental values and aspirations for their child's character and future. ${nameTrimmed} offers both cultural authenticity and contemporary relevance, making it a thoughtful choice for families valuing meaningful names. ${numerologyExplanation}`,

      `${nameTrimmed} stands among names that have been valued across different cultures and communities. The designation carries associations with positive qualities and heritage. Families choosing ${nameTrimmed} bestow upon their child a name of substance that bridges tradition and modernity. ${numerologyExplanation}`
    ];
  }

  return fallbackTemplates[nameHash % fallbackTemplates.length];
};

const parseAIResponse = (content: string, driver: number, conductor: number, religion: string): GeneratedName[] => {
  try {
    const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content.substring(0, 500));
      throw new Error('Invalid response format from AI');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    const FAVORABLE_NUMBERS = [1, 3, 5, 6];
    const antiToDriver = getAntiNumbers(driver);
    const antiToConductor = getAntiNumbers(conductor);

    return parsed.map((item: any) => {
      const nameTrimmed = String(item.name || '').trim();
      const compoundNumber = calculateNameValue(nameTrimmed);
      const correctNumerologyValue = reduceToSingleDigit(compoundNumber);

      console.log(`Name: ${nameTrimmed}, Compound: ${compoundNumber}, Single: ${correctNumerologyValue}, AI said: ${item.numerologyValue}`);

      const aiExplanation = String(item.explanation || '').trim();
      const aiMeaning = String(item.meaning || '').trim();

      let fullExplanation = '';
      const MIN_EXPLANATION_LENGTH = 50;

      if (aiExplanation && aiExplanation.length >= MIN_EXPLANATION_LENGTH && !isGenericExplanation(aiExplanation)) {
        console.log(`✓ ${nameTrimmed}: Using AI explanation (${aiExplanation.length} chars)`);
        const numerologyExplanation = getNumerologyDescription(correctNumerologyValue, driver, conductor);
        fullExplanation = `${aiExplanation} - ${numerologyExplanation}`;
      } else {
        if (aiExplanation && isGenericExplanation(aiExplanation)) {
          console.log(`✗ ${nameTrimmed}: REJECTED generic AI explanation, using detailed template`);
        } else {
          console.log(`⚠ ${nameTrimmed}: Insufficient AI explanation, using detailed template`);
        }
        fullExplanation = generateDetailedExplanation(nameTrimmed, aiMeaning, correctNumerologyValue, driver, conductor, religion);
      }

      return {
        name: nameTrimmed,
        meaning: aiMeaning,
        numerologyValue: correctNumerologyValue,
        compoundNumber: compoundNumber,
        compatibilityScore: Math.max(0, Math.min(100, parseInt(item.compatibilityScore, 10) || 0)),
        explanation: fullExplanation,
      };
    }).filter((name: GeneratedName) => {
      if (name.name.length === 0) return false;

      if (!FAVORABLE_NUMBERS.includes(name.numerologyValue)) {
        console.log(`Filtered out ${name.name}: value ${name.numerologyValue} not in favorable numbers`);
        return false;
      }

      if (antiToDriver.includes(name.numerologyValue)) {
        console.log(`Filtered out ${name.name}: value ${name.numerologyValue} is anti to driver ${driver}`);
        return false;
      }

      if (antiToConductor.includes(name.numerologyValue)) {
        console.log(`Filtered out ${name.name}: value ${name.numerologyValue} is anti to conductor ${conductor}`);
        return false;
      }

      return true;
    });
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are supported" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody: GenerateNamesRequest = await req.json();

    if (!requestBody.gender || !requestBody.religion || !requestBody.driver || !requestBody.conductor) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const generateBatch = async (count: number, temp: number): Promise<GeneratedName[]> => {
      const prompt = buildNumerologyPrompt(requestBody, count);

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
              content: "You are an expert numerologist specializing in baby names. CRITICAL: Every single name in your response MUST have a detailed, unique 'explanation' field that is at least 20 words long. This is NOT optional. Generic or missing explanations are completely unacceptable. Always return valid JSON arrays as requested.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: temp,
          max_tokens: 3500,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text());
        return [];
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        return [];
      }

      return parseAIResponse(content, requestBody.driver, requestBody.conductor, requestBody.religion);
    };

    const TARGET_COUNT = requestBody.count || 12;
    console.log(`Starting optimized batch generation for ${TARGET_COUNT} names...`);

    const batch1Promise = generateBatch(Math.ceil(TARGET_COUNT * 1.2), 0.9);
    const batch2Promise = generateBatch(Math.ceil(TARGET_COUNT * 0.8), 0.95);

    const [batch1, batch2] = await Promise.all([
      batch1Promise,
      batch2Promise,
    ]);

    console.log(`Received: Batch1=${batch1.length}, Batch2=${batch2.length}`);

    const allNames: GeneratedName[] = [];
    const seenNames = new Set<string>();

    for (const name of [...batch1, ...batch2]) {
      const nameLower = name.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower);
        allNames.push(name);

        if (allNames.length >= TARGET_COUNT) {
          break;
        }
      }
    }

    if (allNames.length < TARGET_COUNT) {
      console.log(`Only got ${allNames.length} names, generating one more batch...`);
      const extraBatch = await generateBatch(TARGET_COUNT - allNames.length + 5, 1.0);

      for (const name of extraBatch) {
        const nameLower = name.name.toLowerCase();
        if (!seenNames.has(nameLower)) {
          seenNames.add(nameLower);
          allNames.push(name);

          if (allNames.length >= TARGET_COUNT) {
            break;
          }
        }
      }
    }

    console.log(`Final: Generated ${allNames.length} unique names`);

    let names = allNames.slice(0, TARGET_COUNT);

    if (requestBody.lastName) {
      console.log(`Applying last name filter for: ${requestBody.lastName}`);
      const beforeCount = names.length;
      names = filterNamesByLastName(names, requestBody.lastName);
      console.log(`Filtered from ${beforeCount} to ${names.length} names with valid last name combinations`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        names,
        count: names.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-names-with-ai:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
