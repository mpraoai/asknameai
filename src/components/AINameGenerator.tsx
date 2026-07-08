import React, { useState } from 'react';
import { Wand2, Loader, Heart, Sparkles, Zap, ChevronDown, ExternalLink, Globe } from 'lucide-react';
import { orchestratorService } from '../services/agents/orchestratorService';
import { saveAIGenerationSession, saveGeneratedName } from '../services/aiNameGenerationService';
import { EnrichedName } from '../services/nameEnrichmentService';
import { calculateCombinedName } from '../utils/lastNameValidation';

interface AINameGeneratorProps {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  providedLastName?: string;
}

export const AINameGenerator: React.FC<AINameGeneratorProps> = ({
  gender,
  religion,
  driver,
  conductor,
  targetNumbers,
  loshuGrid,
  providedLastName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<EnrichedName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [showExternalLinks, setShowExternalLinks] = useState<string | null>(null);

  const handleGenerateNames = async () => {
    setIsGenerating(true);
    setError(null);

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount < maxRetries) {
      try {
        const session = sessionId || await saveAIGenerationSession(gender, religion, driver, conductor, targetNumbers);
        if (session && !sessionId) {
          setSessionId(session);
        }

        const existingNames = new Set(generatedNames.map(n => n.name.toLowerCase()));

        console.log('🚀 Calling NEW Agentic Orchestrator...');
        const result = await orchestratorService.generateNames({
          gender,
          religion,
          driver,
          conductor,
          targetNumbers,
          loshuGrid,
          lastName: providedLastName
        });

        console.log('✅ Orchestrator returned:', result.metadata);
        console.log(`   - AI Agent: ${result.metadata.aiCount} names`);
        console.log(`   - Database Agent: ${result.metadata.databaseCount} names`);
        console.log(`   - Total Time: ${result.metadata.executionTimeMs}ms`);

        const enrichedNames: EnrichedName[] = result.names.map(name => ({
          ...name,
          sourceType: 'ai_generated' as const,
          externalLinks: name.externalLinks || []
        }));

        const uniqueNames = enrichedNames.filter(name => !existingNames.has(name.name.toLowerCase()));

        if (uniqueNames.length === 0 && enrichedNames.length > 0) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`All names were duplicates. Retrying (${retryCount}/${maxRetries})...`);
            continue;
          } else {
            setError('Unable to generate new unique names. Please try again.');
            setIsGenerating(false);
            return;
          }
        }

        setGeneratedNames(prev => [...prev, ...uniqueNames]);

        if (session && uniqueNames.length > 0) {
          for (const name of uniqueNames) {
            await saveGeneratedName(session, {
              name: name.name,
              meaning: name.meaning,
              numerologyValue: name.numerologyValue,
              compatibilityScore: name.compatibilityScore,
              explanation: name.explanation
            });
          }
        }

        setIsGenerating(false);
        return;
      } catch (err) {
        if (retryCount >= maxRetries - 1) {
          setError(err instanceof Error ? err.message : 'Failed to generate names. Please try again.');
          console.error('Generation error:', err);
          setIsGenerating(false);
          return;
        }
        retryCount++;
        console.log(`Error occurred, retrying (${retryCount}/${maxRetries})...`, err);
      }
    }

    setIsGenerating(false);
  };

  const toggleSaveName = (name: string) => {
    const newSavedNames = new Set(savedNames);
    if (newSavedNames.has(name)) {
      newSavedNames.delete(name);
    } else {
      newSavedNames.add(name);
    }
    setSavedNames(newSavedNames);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getNumerologyColor = (num: number) => {
    const colors: Record<number, string> = {
      1: 'text-yellow-600 bg-yellow-100',
      2: 'text-orange-600 bg-orange-100',
      3: 'text-purple-600 bg-purple-100',
      4: 'text-red-600 bg-red-100',
      5: 'text-green-600 bg-green-100',
      6: 'text-blue-600 bg-blue-100',
      7: 'text-indigo-600 bg-indigo-100',
      8: 'text-red-700 bg-red-100',
      9: 'text-pink-600 bg-pink-100',
    };
    return colors[num] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 rounded-2xl shadow-xl p-8 border border-teal-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-xl shadow-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Ask Name AI</h2>
            <p className="text-sm bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-medium">AI-Powered Global Name Suggestions with Numerology</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mb-6 p-4 bg-white rounded-xl border border-teal-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Gender</span>
                <p className="font-semibold text-teal-700">{gender === 'male' ? 'Boy' : 'Girl'}</p>
              </div>
              <div>
                <span className="text-gray-600">Religion</span>
                <p className="font-semibold text-teal-700 capitalize">{religion}</p>
              </div>
              <div>
                <span className="text-gray-600">Driver</span>
                <p className="font-semibold text-teal-700">{driver}</p>
              </div>
              <div>
                <span className="text-gray-600">Conductor</span>
                <p className="font-semibold text-teal-700">{conductor}</p>
              </div>
            </div>
            {providedLastName && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <span className="text-sm text-amber-800 font-medium">Last Name: </span>
                <span className="text-sm font-bold text-amber-900">{providedLastName.toUpperCase()}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateNames}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold hover:from-teal-600 hover:via-cyan-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 transition-all flex items-center justify-center gap-2 mb-6 relative overflow-hidden shadow-lg hover:shadow-xl"
          >
            {isGenerating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            )}
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-base">Generating 12 Names...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span className="text-base">{generatedNames.length > 0 ? 'Generate 12 More Names' : 'Generate AI Names Now'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
              <p className="font-semibold">Generation Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {generatedNames.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Generated Names ({generatedNames.length})
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all hover:border-teal-300 hover:shadow-teal-100 animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold flex flex-wrap items-baseline gap-2">
                          <span className="text-gray-800 whitespace-nowrap">{name.name}</span>
                          {providedLastName && <span className="text-blue-600 whitespace-nowrap">{providedLastName.charAt(0).toUpperCase() + providedLastName.slice(1).toLowerCase()}</span>}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{name.meaning}</p>
                      </div>
                      <button
                        onClick={() => toggleSaveName(name.name)}
                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                          savedNames.has(name.name)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${savedNames.has(name.name) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {providedLastName ? (
                      <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 font-medium">First Name:</span>
                            <span className="text-sm font-bold text-gray-900">{name.compoundNumber || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 font-medium">Last Name:</span>
                            <span className="text-sm font-bold text-gray-900">{calculateCombinedName(name.name, providedLastName).combinedTotal - (name.compoundNumber || 0)}</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent my-2"></div>
                          <div className="flex justify-between items-center bg-white rounded-md p-2 shadow-sm">
                            <span className="text-xs font-bold text-purple-700">Numerology:</span>
                            <span className="text-base font-bold text-purple-600">
                              {calculateCombinedName(name.name, providedLastName).combinedTotal}→{calculateCombinedName(name.name, providedLastName).combinedReduced}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-gray-600 font-medium">Match:</span>
                            <span className="text-sm font-bold text-green-600">
                              {typeof name.compatibilityScore === 'number' ? name.compatibilityScore : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getNumerologyColor(name.numerologyValue || 0)}`}>
                            Numerology: {
                              name.compoundNumber && name.compoundNumber > 9
                                ? `${name.compoundNumber}→${name.numerologyValue}`
                                : typeof name.numerologyValue === 'number' ? name.numerologyValue : 0
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompatibilityColor(name.compatibilityScore || 0)}`}>
                            Match: {typeof name.compatibilityScore === 'number' ? name.compatibilityScore : 0}%
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {name.explanation || 'This name carries significant cultural and numerological importance.'}
                    </p>

                    {name.externalLinks && name.externalLinks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => setShowExternalLinks(showExternalLinks === name.name ? null : name.name)}
                          className="flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          <span>{showExternalLinks === name.name ? 'Hide' : 'Show'} External References ({name.externalLinks.length})</span>
                        </button>
                        {showExternalLinks === name.name && (
                          <div className="mt-2 space-y-1">
                            {name.externalLinks.map((link, linkIndex) => (
                              <a
                                key={linkIndex}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline p-2 bg-blue-50 rounded-lg"
                              >
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && Array.from({ length: 12 - generatedNames.length }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>

                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>

              {savedNames.size > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">{savedNames.size} name(s) saved</span> to your favorites
                  </p>
                </div>
              )}
            </div>
          )}

          {!isGenerating && generatedNames.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Click "Generate AI Names Now" to start finding auspicious names</p>
              <p className="text-xs mt-2 text-gray-400">Powered by advanced AI numerology</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
