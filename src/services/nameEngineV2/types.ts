export interface NameEngineV2Request {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  lastName?: string;
  keywords?: string;
  startingLetter?: string;
}

export interface GeneratedNameV2 {
  name: string;
  meaning: string;
  numerologyValue: number;
  compoundNumber: number;
  compatibilityScore: number;
  explanation: string;
  source: 'ai' | 'database';
  externalLinks?: Array<{ url: string; title: string; type: string }>;
}
