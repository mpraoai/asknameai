import { reduceToSingleDigit } from './chaldeanValues';

interface NumerologyAntiPairs {
  [key: number]: number[];
}

const NUMEROLOGY_ANTI_PAIRS: NumerologyAntiPairs = {
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

const getNumerologyDescription = (nameValue: number, driver: number, conductor: number): string => {
  const FAVORABLE_NUMBERS = [1, 3, 5, 6];
  const antiToDriver = NUMEROLOGY_ANTI_PAIRS[driver] || [];
  const antiToConductor = NUMEROLOGY_ANTI_PAIRS[conductor] || [];

  if (nameValue === driver) {
    return `This name embodies numerology value ${nameValue}, directly matching your Driver Number and providing natural harmony with your life purpose, creating strong resonance with your core identity.`;
  }

  if (nameValue === conductor) {
    return `This name embodies numerology value ${nameValue}, aligning with your Conductor Number and supporting your relationship dynamics, bringing favorable vibrations to your social interactions.`;
  }

  if (antiToDriver.includes(nameValue)) {
    return `This name carries numerology value ${nameValue}, which may present challenges as it conflicts with your Driver Number ${driver}, potentially requiring extra effort to harmonize energies.`;
  }

  if (antiToConductor.includes(nameValue)) {
    return `This name carries numerology value ${nameValue}, which may create tension with your Conductor Number ${conductor}, suggesting the need for conscious balance in relationships.`;
  }

  if (FAVORABLE_NUMBERS.includes(nameValue)) {
    return `This name resonates with numerology value ${nameValue}, a universally favorable number that brings positive vibrations, success potential, and harmonious energy to the child's numerological profile.`;
  }

  return `This name carries numerology value ${nameValue}, adding unique vibrational qualities to your child's numerological profile and contributing to their life path expression.`;
};

export const generateExplanation = (
  name: string,
  meaning: string | undefined,
  numerologyValue: number,
  driver: number,
  conductor: number,
  religion: string
): string => {
  const nameTrimmed = name.trim();
  const meaningLower = (meaning || '').toLowerCase().trim();
  const religionLower = religion.toLowerCase().trim();

  const numerologyExplanation = getNumerologyDescription(numerologyValue, driver, conductor);

  const nameHash = nameTrimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  if (meaningLower) {
    return generateMeaningBasedExplanation(nameTrimmed, meaningLower, religionLower, numerologyExplanation, nameHash);
  } else {
    return generateFallbackExplanation(nameTrimmed, religionLower, numerologyExplanation, nameHash);
  }
};

const generateMeaningBasedExplanation = (
  name: string,
  meaning: string,
  religion: string,
  numerologyExplanation: string,
  hash: number
): string => {
  const templates = getMeaningTemplates(name, meaning, religion, numerologyExplanation);
  return templates[hash % templates.length];
};

const generateFallbackExplanation = (
  name: string,
  religion: string,
  numerologyExplanation: string,
  hash: number
): string => {
  const templates = getFallbackTemplates(name, religion, numerologyExplanation);
  return templates[hash % templates.length];
};

const getMeaningTemplates = (
  name: string,
  meaning: string,
  religion: string,
  numerologyExplanation: string
): string[] => {
  if (religion === 'hindu') {
    return [
      `${name} translates to '${meaning}', rooted in Sanskrit linguistic tradition and carrying deep cultural resonance. This name appears in Hindu spiritual literature and reflects values central to dharmic philosophy. Parents choosing ${name} connect their child to millennia of cultural heritage while offering a name whose meaning remains relevant and beautiful in contemporary contexts. ${numerologyExplanation}`,
      `In Hindu tradition, ${name} means '${meaning}', embodying qualities celebrated in Vedic literature and cultural practice. The name may reference deities, virtues, or elements from Hindu mythology and spiritual teachings. Families selecting ${name} honor this heritage, bestowing a name that carries both spiritual significance and aesthetic appeal. ${numerologyExplanation}`,
      `The name ${name}, signifying '${meaning}', holds special meaning in Hindu communities. It reflects Sanskrit linguistic beauty and may connect to stories from the Ramayana, Mahabharata, or Puranas. ${name} represents a thoughtful choice that honors tradition while carrying timeless significance. ${numerologyExplanation}`,
      `${name} carries the beautiful meaning of '${meaning}', a concept woven through Hindu philosophy and cultural traditions. The name resonates with dharmic values and may reflect attributes praised in Hindu texts. Parents selecting ${name} offer their child a name rich with cultural meaning and spiritual depth. ${numerologyExplanation}`
    ];
  } else if (religion === 'muslim') {
    return [
      `${name} translates to '${meaning}', carrying significance within Islamic tradition and Arabic linguistic heritage. This name may appear in Islamic history or reflect attributes praised in the Quran. Parents choosing ${name} connect their child to centuries of Islamic culture while selecting a name with profound meaning and beauty. ${numerologyExplanation}`,
      `In Muslim tradition, ${name} means '${meaning}', embodying qualities valued in Islamic teachings. The name may reference prophetic traditions, Quranic concepts, or virtues celebrated throughout Islamic history. Families selecting ${name} honor this legacy, bestowing a name that reflects faith and cultural identity. ${numerologyExplanation}`,
      `The name ${name}, signifying '${meaning}', holds meaning in Muslim communities worldwide. It reflects Arabic linguistic beauty and may connect to Islamic spiritual heritage. ${name} represents a meaningful choice that honors religious tradition while carrying contemporary relevance. ${numerologyExplanation}`,
      `${name} carries the beautiful meaning of '${meaning}', a concept valued in Islamic culture and tradition. The name resonates with Muslim values and may reflect attributes praised in Islamic texts. Parents selecting ${name} offer their child a name rich with cultural and spiritual significance. ${numerologyExplanation}`
    ];
  } else if (religion === 'christian') {
    return [
      `${name} translates to '${meaning}', carrying significance within Christian tradition. This name may appear in Biblical texts or reflect virtues praised in Christian teachings. Parents choosing ${name} connect their child to centuries of faith tradition while selecting a name with enduring meaning and spiritual depth. ${numerologyExplanation}`,
      `In Christian tradition, ${name} means '${meaning}', embodying qualities celebrated in scripture and church history. The name may reference Biblical figures, saints, or virtues taught in Christian faith. Families selecting ${name} honor this heritage, bestowing a name that reflects spiritual values and cultural identity. ${numerologyExplanation}`,
      `The name ${name}, signifying '${meaning}', holds meaning in Christian communities. It may connect to Biblical narratives or reflect virtues praised in Christian teachings. ${name} represents a thoughtful choice that honors faith tradition while carrying timeless significance. ${numerologyExplanation}`,
      `${name} carries the beautiful meaning of '${meaning}', a concept valued in Christian faith and culture. The name may reflect attributes celebrated in scripture or church tradition. Parents selecting ${name} offer their child a name rich with spiritual meaning and historical depth. ${numerologyExplanation}`
    ];
  } else if (religion === 'sikh') {
    return [
      `${name} translates to '${meaning}', embodying a quality valued in Sikh philosophy and tradition. The name reflects virtues taught in the Guru Granth Sahib, emphasizing courage, devotion, and righteousness. Parents choosing ${name} connect their child to Sikh heritage, selecting a name that resonates with principles of equality, service, and spiritual strength. ${numerologyExplanation}`,
      `In Sikh tradition, ${name} means '${meaning}', representing an attribute celebrated in the community. This name carries associations with Sikh values and may reflect qualities emphasized in gurbani. Families selecting ${name} honor Sikh heritage, bestowing a name that reflects spiritual and cultural significance. ${numerologyExplanation}`,
      `The name ${name}, signifying '${meaning}', holds special resonance in Sikh communities. It embodies qualities that align with Sikh principles and may connect to Punjabi cultural heritage. ${name} represents a meaningful choice that honors tradition while reflecting Sikh values. ${numerologyExplanation}`,
      `${name} carries the beautiful meaning of '${meaning}', a concept woven into Sikh teachings. The name reflects values emphasized in Sikh tradition and may embody qualities praised in the community. Parents selecting ${name} offer their child a name that honors Sikh heritage and spiritual values. ${numerologyExplanation}`
    ];
  } else {
    return [
      `${name} translates to '${meaning}', embodying a quality admired across cultures and traditions. The name carries timeless appeal, reflecting virtues that parents hope to see flourish in their child. ${name} represents a thoughtful choice that honors heritage while celebrating individual potential and character. ${numerologyExplanation}`,
      `The name ${name} means '${meaning}', representing an attribute valued universally. This designation has been chosen by families across different cultures and times, each finding resonance in its meaning. Parents selecting ${name} offer their child a name that carries both significance and beauty. ${numerologyExplanation}`,
      `${name}, signifying '${meaning}', holds special meaning for families who choose it. The name reflects qualities that transcend cultural boundaries—virtues appreciated in diverse traditions worldwide. ${name} represents both personal identity and parental aspiration. ${numerologyExplanation}`,
      `${name} carries the beautiful meaning of '${meaning}', a concept that resonates across cultures. Parents who select this name appreciate its linguistic grace and the ideals it represents. ${name} offers a child a designation that combines heritage with timeless appeal. ${numerologyExplanation}`
    ];
  }
};

const getFallbackTemplates = (
  name: string,
  religion: string,
  numerologyExplanation: string
): string[] => {
  if (religion === 'hindu') {
    return [
      `${name} is a name with distinguished roots in Hindu tradition, appearing in ancient texts and spiritual literature. The name's usage across diverse Indian regions testifies to its broad appeal and cultural significance. Parents who select ${name} choose a designation that connects their child to centuries of dharmic heritage. ${numerologyExplanation}`,
      `The name ${name} carries weight in Sanskrit naming conventions, having been borne by notable figures throughout Indian history. Its selection reflects parental values and aspirations for their child's development. ${name} offers both cultural authenticity and contemporary relevance. ${numerologyExplanation}`,
      `${name} stands among names that have shaped Hindu cultural identity across generations. The designation appears in mythology, devotional literature, and historical records. Families choosing ${name} participate in this ongoing tradition. ${numerologyExplanation}`
    ];
  } else if (religion === 'muslim') {
    return [
      `${name} is a name with distinguished roots in Islamic tradition, appearing in historical records and classical texts. The name's usage across diverse Muslim regions testifies to its broad appeal and cultural significance. Parents who select ${name} choose a designation that connects their child to centuries of Islamic heritage. ${numerologyExplanation}`,
      `The name ${name} carries weight in Arabic naming conventions, having been borne by notable figures throughout Islamic history. Its selection reflects parental values and aspirations for their child's character. ${name} offers both cultural authenticity and contemporary relevance. ${numerologyExplanation}`,
      `${name} stands among names that have shaped Muslim cultural identity across generations. The designation appears in literature and historical chronicles. Families choosing ${name} participate in this ongoing tradition. ${numerologyExplanation}`
    ];
  } else if (religion === 'christian') {
    return [
      `${name} is a name with roots in Christian tradition, reflecting values treasured in faith communities. The name's usage across diverse Christian communities testifies to its spiritual significance. Parents who select ${name} choose a designation that connects their child to centuries of faith heritage. ${numerologyExplanation}`,
      `The name ${name} carries significance in Christian naming traditions, embodying qualities valued in the faith. Its selection reflects parental spiritual aspirations for their child. ${name} offers both religious meaning and contemporary relevance. ${numerologyExplanation}`,
      `${name} stands among names cherished in Christian communities. The designation may connect to scripture or church tradition. Families choosing ${name} participate in this tradition of faith. ${numerologyExplanation}`
    ];
  } else if (religion === 'sikh') {
    return [
      `${name} is a name with roots in Sikh tradition, reflecting the community's values of courage and devotion. The name's usage across Punjabi communities testifies to its cultural significance. Parents who select ${name} choose a designation that connects their child to Sikh heritage. ${numerologyExplanation}`,
      `The name ${name} carries significance in Sikh naming traditions, embodying qualities valued by the community. Its selection reflects parental aspirations for their child's spiritual strength. ${name} offers both cultural authenticity and contemporary relevance. ${numerologyExplanation}`,
      `${name} stands among names that resonate with Sikh identity and principles. Families choosing ${name} participate in this tradition, bestowing a name that carries cultural and spiritual depth. ${numerologyExplanation}`
    ];
  } else {
    return [
      `${name} is a name with cultural roots that resonate across traditions. The name's usage by families from diverse backgrounds testifies to its broad appeal. Parents who select ${name} choose a designation that honors their heritage. ${numerologyExplanation}`,
      `The name ${name} carries significance across cultural naming traditions. Its selection reflects parental values and aspirations for their child's character. ${name} offers both cultural meaning and contemporary relevance. ${numerologyExplanation}`,
      `${name} stands among names valued across different cultures and communities. Families choosing ${name} bestow a name that bridges tradition and modernity. ${numerologyExplanation}`
    ];
  }
};
