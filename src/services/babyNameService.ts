import { supabase } from '../lib/supabase';
import { isCompatibleWithDriverConductor } from '../utils/compatibility';
import { calculateCombinedName } from '../utils/lastNameValidation';

export interface BabyNameData {
  id: string;
  name: string;
  name_devanagari?: string;
  name_regional?: string;
  gender: 'male' | 'female' | 'unisex';
  religion: string;
  region?: string;
  language_origin?: string;
  source_type?: string;
  source_scripture?: string;
  deity_association?: string;
  meaning: string;
  detailed_meaning?: string;
  etymology?: string;
  numerology_value?: number;
  popularity_score: number;
  is_verified: boolean;
  generation_source: string;
}

export interface NameQueryFilters {
  gender: 'male' | 'female';
  religion: string;
  region?: string;
  sourceScripture?: string;
  numerologyValues?: number[];
  excludeNumbers?: number[];
}

export const fetchBabyNames = async (filters: NameQueryFilters): Promise<BabyNameData[]> => {
  try {
    let query = supabase
      .from('baby_names')
      .select('*')
      .eq('gender', filters.gender)
      .eq('religion', filters.religion.toLowerCase());

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.sourceScripture) {
      query = query.eq('source_scripture', filters.sourceScripture);
    }

    if (filters.numerologyValues && filters.numerologyValues.length > 0) {
      query = query.in('numerology_value', filters.numerologyValues);
    }

    if (filters.excludeNumbers && filters.excludeNumbers.length > 0) {
      query = query.not('numerology_value', 'in', `(${filters.excludeNumbers.join(',')})`);
    }

    query = query.order('popularity_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching baby names:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBabyNames:', error);
    return [];
  }
};

export const fetchNamesByNumerology = async (
  gender: 'male' | 'female',
  religion: string,
  targetNumbers: number[],
  excludeNumbers: number[] = [4, 8]
): Promise<BabyNameData[]> => {
  try {
    const { data, error } = await supabase
      .from('baby_names')
      .select('*')
      .eq('gender', gender)
      .eq('religion', religion.toLowerCase())
      .in('numerology_value', targetNumbers)
      .not('numerology_value', 'in', `(${excludeNumbers.join(',')})`)
      .order('popularity_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching names by numerology:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchNamesByNumerology:', error);
    return [];
  }
};

export const fetchCompatibleNames = async (
  gender: 'male' | 'female',
  religion: string,
  driver: number,
  conductor: number,
  targetNumbers: number[] = [],
  lastName?: string
): Promise<BabyNameData[]> => {
  try {
    const FAVORABLE_NUMBERS = [1, 3, 5, 6];

    let query = supabase
      .from('baby_names')
      .select('*')
      .eq('gender', gender)
      .eq('religion', religion.toLowerCase())
      .in('numerology_value', FAVORABLE_NUMBERS);

    if (targetNumbers.length > 0) {
      const compatibleTargets = targetNumbers.filter(n =>
        isCompatibleWithDriverConductor(n, driver, conductor)
      );
      if (compatibleTargets.length > 0) {
        query = query.in('numerology_value', compatibleTargets);
      }
    }

    query = query.order('popularity_score', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching compatible names:', error);
      return [];
    }

    const filtered = (data || []).filter((name) => {
      if (!name.numerology_value) return false;
      return isCompatibleWithDriverConductor(name.numerology_value, driver, conductor);
    });

    const seenBaseNames = new Set<string>();
    const uniqueNames: BabyNameData[] = [];

    for (const name of filtered) {
      const baseName = name.name.replace(/\d+$/g, '').toLowerCase().trim();

      if (!seenBaseNames.has(baseName) && name.gender === gender) {
        seenBaseNames.add(baseName);
        uniqueNames.push(name);
      }
    }

    const { data: allNames } = await supabase
      .from('baby_names')
      .select('name, gender')
      .in('name', uniqueNames.map(n => n.name));

    const nameGenderCount = new Map<string, Set<string>>();
    (allNames || []).forEach(n => {
      const baseName = n.name.replace(/\d+$/g, '').toLowerCase().trim();
      if (!nameGenderCount.has(baseName)) {
        nameGenderCount.set(baseName, new Set());
      }
      nameGenderCount.get(baseName)!.add(n.gender);
    });

    const genderSpecificNames = uniqueNames.filter(name => {
      const baseName = name.name.replace(/\d+$/g, '').toLowerCase().trim();
      const genders = nameGenderCount.get(baseName);
      return genders && genders.size === 1;
    });

    if (lastName && lastName.trim()) {
      const filteredByLastName = genderSpecificNames.filter(name => {
        const cleanName = name.name.replace(/\d+$/g, '').trim();
        const result = calculateCombinedName(cleanName, lastName);
        return result.isValid;
      });
      return filteredByLastName;
    }

    return genderSpecificNames;
  } catch (error) {
    console.error('Error in fetchCompatibleNames:', error);
    return [];
  }
};

export const fetchAllNamesForReligion = async (
  gender: 'male' | 'female',
  religion: string
): Promise<BabyNameData[]> => {
  try {
    const { data, error } = await supabase
      .from('baby_names')
      .select('*')
      .eq('gender', gender)
      .eq('religion', religion.toLowerCase())
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching all names:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllNamesForReligion:', error);
    return [];
  }
};

export const fetchRegionalNames = async (
  gender: 'male' | 'female',
  religion: string,
  region: string
): Promise<BabyNameData[]> => {
  try {
    const { data, error } = await supabase
      .from('baby_names')
      .select('*')
      .eq('gender', gender)
      .eq('religion', religion.toLowerCase())
      .eq('region', region)
      .order('popularity_score', { ascending: false });

    if (error) {
      console.error('Error fetching regional names:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRegionalNames:', error);
    return [];
  }
};

export const fetchScripturalNames = async (
  gender: 'male' | 'female',
  religion: string,
  scripture: string
): Promise<BabyNameData[]> => {
  try {
    const { data, error } = await supabase
      .from('baby_names')
      .select('*')
      .eq('gender', gender)
      .eq('religion', religion.toLowerCase())
      .eq('source_scripture', scripture)
      .order('popularity_score', { ascending: false });

    if (error) {
      console.error('Error fetching scriptural names:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchScripturalNames:', error);
    return [];
  }
};
