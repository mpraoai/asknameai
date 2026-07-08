import { supabase } from '../lib/supabase';

export interface ExternalNameSource {
  id: string;
  source_name: string;
  source_type: string;
  api_endpoint?: string;
  is_active: boolean;
  rate_limit_per_day: number;
  requests_today: number;
  last_request_at?: string;
  metadata: Record<string, any>;
}

export interface ExternalNameData {
  sourceName: string;
  etymology?: string;
  popularity?: {
    rank?: number;
    region?: string;
    year?: number;
  };
  externalLinks?: Array<{
    url: string;
    title: string;
    type: string;
  }>;
  culturalSignificance?: string;
  historicalFigures?: string[];
  modernUsage?: string;
}

export interface NameEnrichmentResult {
  success: boolean;
  enrichmentData: ExternalNameData[];
  error?: string;
}

export const fetchActiveSources = async (): Promise<ExternalNameSource[]> => {
  try {
    const { data, error } = await supabase
      .from('external_name_sources')
      .select('*')
      .eq('is_active', true)
      .order('source_name', { ascending: true });

    if (error) {
      console.error('Error fetching external sources:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchActiveSources:', error);
    return [];
  }
};

export const enrichNameWithBehindTheName = async (
  name: string
): Promise<ExternalNameData | null> => {
  try {
    return {
      sourceName: 'Behind the Name',
      externalLinks: [
        {
          url: `https://www.behindthename.com/name/${name.toLowerCase()}`,
          title: `${name} - Etymology and History`,
          type: 'etymology'
        }
      ]
    };
  } catch (error) {
    console.error('Error enriching with Behind the Name:', error);
    return null;
  }
};

export const enrichNameWithWikipedia = async (
  name: string,
  religion: string
): Promise<ExternalNameData | null> => {
  try {
    const searchTerm = `${name} (given name)`;
    return {
      sourceName: 'Wikipedia',
      externalLinks: [
        {
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
          title: `${name} - Wikipedia`,
          type: 'encyclopedia'
        }
      ]
    };
  } catch (error) {
    console.error('Error enriching with Wikipedia:', error);
    return null;
  }
};

export const enrichNameWithMomJunction = async (
  name: string,
  gender: 'male' | 'female'
): Promise<ExternalNameData | null> => {
  try {
    const nameLower = name.toLowerCase().replace(/\s+/g, '-');
    return {
      sourceName: 'MomJunction',
      externalLinks: [
        {
          url: `https://www.momjunction.com/baby-names/${nameLower}/`,
          title: `${name} - Meaning & Origin`,
          type: 'popularity'
        }
      ]
    };
  } catch (error) {
    console.error('Error enriching with MomJunction:', error);
    return null;
  }
};

export const enrichNameWithNameberry = async (
  name: string
): Promise<ExternalNameData | null> => {
  try {
    return {
      sourceName: 'Nameberry',
      externalLinks: [
        {
          url: `https://nameberry.com/babyname/${name.toLowerCase()}`,
          title: `${name} - Origin, Meaning & Popularity`,
          type: 'comprehensive'
        }
      ]
    };
  } catch (error) {
    console.error('Error enriching with Nameberry:', error);
    return null;
  }
};

export const enrichNameWithReligiousSource = (
  name: string,
  religion: string
): ExternalNameData | null => {
  try {
    const religiousSources: Record<string, { url: string; title: string }> = {
      hindu: {
        url: `https://www.indianchildnames.com/name.aspx?name=${name}`,
        title: `${name} - Hindu/Sanskrit Meaning`
      },
      muslim: {
        url: `https://quranicnames.com/search/${name}`,
        title: `${name} - Islamic/Quranic Names`
      },
      christian: {
        url: `https://www.biblestudytools.com/dictionary/${name.toLowerCase()}`,
        title: `${name} - Biblical Reference`
      },
      sikh: {
        url: `https://www.sikhnet.com/pages/sikh-names?search=${name}`,
        title: `${name} - Sikh Names Meaning`
      },
      buddhist: {
        url: `https://www.momjunction.com/buddhist-baby-names/${name.toLowerCase()}`,
        title: `${name} - Buddhist Name Meaning`
      },
      jewish: {
        url: `https://www.aish.com/j/names/${name.toLowerCase()}`,
        title: `${name} - Hebrew/Jewish Names`
      }
    };

    const source = religiousSources[religion.toLowerCase()];
    if (!source) return null;

    return {
      sourceName: `${religion.charAt(0).toUpperCase() + religion.slice(1)} Religious Source`,
      externalLinks: [
        {
          url: source.url,
          title: source.title,
          type: 'religious'
        }
      ]
    };
  } catch (error) {
    console.error('Error enriching with religious source:', error);
    return null;
  }
};

export const enrichNameWithMultipleSources = async (
  name: string,
  gender: 'male' | 'female',
  religion: string
): Promise<NameEnrichmentResult> => {
  try {
    const enrichmentPromises = [
      enrichNameWithBehindTheName(name),
      enrichNameWithWikipedia(name, religion),
      enrichNameWithMomJunction(name, gender),
      enrichNameWithNameberry(name),
      Promise.resolve(enrichNameWithReligiousSource(name, religion))
    ];

    const results = await Promise.all(enrichmentPromises);
    const enrichmentData = results.filter((data): data is ExternalNameData => data !== null);

    return {
      success: true,
      enrichmentData
    };
  } catch (error) {
    console.error('Error enriching name with multiple sources:', error);
    return {
      success: false,
      enrichmentData: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const saveEnrichmentToDatabase = async (
  babyNameId: string,
  enrichmentData: ExternalNameData[]
): Promise<boolean> => {
  try {
    const allLinks = enrichmentData.flatMap(data => data.externalLinks || []);

    const { error } = await supabase
      .from('baby_names')
      .update({
        external_links: allLinks,
        last_enriched_at: new Date().toISOString()
      })
      .eq('id', babyNameId);

    if (error) {
      console.error('Error saving enrichment to database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveEnrichmentToDatabase:', error);
    return false;
  }
};

export const logEnrichment = async (
  babyNameId: string,
  sourceId: string | null,
  enrichmentType: string,
  dataAdded: Record<string, any>,
  success: boolean,
  errorMessage?: string
): Promise<void> => {
  try {
    await supabase.from('name_enrichment_logs').insert({
      baby_name_id: babyNameId,
      source_id: sourceId,
      enrichment_type: enrichmentType,
      data_added: dataAdded,
      success,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Error logging enrichment:', error);
  }
};

export const getGlobalReligions = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('global_religion_mappings')
      .select('*')
      .eq('supported', true)
      .order('religion_name', { ascending: true });

    if (error) {
      console.error('Error fetching global religions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGlobalReligions:', error);
    return [];
  }
};
