import React, { useEffect, useRef, useState } from 'react';
import { Zap, Loader, Heart, Sparkles, ChevronDown, ExternalLink, Globe, RotateCcw } from 'lucide-react';
import { generateNamesV2 } from '../services/nameEngineV2/orchestratorV2';
import { GeneratedNameV2 } from '../services/nameEngineV2/types';
import { getCurrentProfile, UserProfile } from '../services/authService';
import { getSavedNames, saveName, removeSavedNameByName } from '../services/customerDashboardService';

interface AINameGeneratorV2Props {
  gender: 'male' | 'female';
  religion: string;
  driver: number;
  conductor: number;
  targetNumbers: number[];
  loshuGrid: number[][];
  providedLastName?: string;
}

export const AINameGeneratorV2: React.FC<AINameGeneratorV2Props> = ({
  gender,
  religion,
  driver,
  conductor,
  targetNumbers,
  loshuGrid,
  providedLastName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [names, setNames] = useState<GeneratedNameV2[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showExternalLinks, setShowExternalLinks] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  const [startingLetter, setStartingLetter] = useState('');
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const cancelRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    return () => cancelRef.current?.cancel();
  }, []);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      setProfile(p);
      if (p) {
        const persisted = await getSavedNames(p.id);
        setSavedNames(new Set(persisted.filter((n) => n.category === 'baby_name').map((n) => n.name)));
      }
    })();
  }, []);

  const runGeneration = (count: number, resetList: boolean) => {
    cancelRef.current?.cancel();
    setError(null);
    setIsGenerating(true);

    if (resetList) setNames([]);

    const excludeNames = resetList ? [] : names.map((n) => n.name);

    let received = 0;

    cancelRef.current = generateNamesV2(
      {
        gender,
        religion,
        driver,
        conductor,
        targetNumbers,
        loshuGrid,
        lastName: providedLastName,
        keywords: keywords.trim() || undefined,
        startingLetter: startingLetter.trim() || undefined,
        count,
        excludeNames,
      },
      {
        onName: (name) => {
          received++;
          setNames((prev) =>
            prev.some((n) => n.name.toLowerCase() === name.name.toLowerCase())
              ? prev
              : [...prev, name]
          );
        },
        onEnriched: (nameStr, links) => {
          setNames((prev) =>
            prev.map((n) => (n.name === nameStr ? { ...n, externalLinks: links } : n))
          );
        },
        onDone: () => {
          setIsGenerating(false);
          if (received === 0) {
            setError('Unable to generate names right now. Please try again.');
          }
        },
        onError: (err) => {
          setIsGenerating(false);
          setError(err.message || 'Failed to generate names. Please try again.');
        },
      }
    );
  };

  const toggleSaveName = (name: string) => {
    const next = new Set(savedNames);
    const wasSaved = next.has(name);
    wasSaved ? next.delete(name) : next.add(name);
    setSavedNames(next);
    if (profile) {
      if (wasSaved) removeSavedNameByName(profile.id, name);
      else saveName(profile.id, name, 'baby_name');
    }
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
      3: 'text-purple-600 bg-purple-100',
      5: 'text-green-600 bg-green-100',
      6: 'text-blue-600 bg-blue-100',
    };
    return colors[num] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-violet-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 rounded-xl shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
              Ask Name AI
              <span className="text-xs font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full align-middle">
                FAST ENGINE (BETA)
              </span>
            </h2>
            <p className="text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent font-medium">
              Streaming AI name generation — compare with the results above
            </p>
          </div>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mb-6 p-4 bg-white rounded-xl border border-violet-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              <div>
                <span className="text-gray-600">Gender</span>
                <p className="font-semibold text-violet-700">{gender === 'male' ? 'Boy' : 'Girl'}</p>
              </div>
              <div>
                <span className="text-gray-600">Religion</span>
                <p className="font-semibold text-violet-700 capitalize">{religion}</p>
              </div>
              <div>
                <span className="text-gray-600">Driver</span>
                <p className="font-semibold text-violet-700">{driver}</p>
              </div>
              <div>
                <span className="text-gray-600">Conductor</span>
                <p className="font-semibold text-violet-700">{conductor}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Style/keywords (optional), e.g. modern, warrior, moonlight"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <input
                type="text"
                value={startingLetter}
                onChange={(e) => setStartingLetter(e.target.value.slice(0, 1))}
                placeholder="Starting letter (optional), e.g. A"
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => runGeneration(12, true)}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 text-white py-4 px-6 rounded-xl font-bold hover:from-violet-600 hover:via-fuchsia-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-base">Streaming names...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span className="text-base">{names.length > 0 ? 'Regenerate' : 'Generate Names Now'}</span>
                </>
              )}
            </button>

            {names.length > 0 && (
              <button
                onClick={() => runGeneration(6, false)}
                disabled={isGenerating}
                title="Load more without repeating names already shown"
                className="px-5 py-4 bg-white border-2 border-violet-300 text-violet-700 rounded-xl font-semibold hover:bg-violet-50 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Load More
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
              <p className="font-semibold">Generation Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {names.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Generated Names ({names.length}){isGenerating && ' — streaming...'}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {names.map((name, index) => (
                  <div
                    key={`${name.name}-${index}`}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all hover:border-violet-300 hover:shadow-violet-100 animate-fadeIn"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold flex flex-wrap items-baseline gap-2">
                          <span className="text-gray-800 whitespace-nowrap">{name.name}</span>
                          {providedLastName && (
                            <span className="text-blue-600 whitespace-nowrap">
                              {providedLastName.charAt(0).toUpperCase() + providedLastName.slice(1).toLowerCase()}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              name.source === 'ai' ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {name.source === 'ai' ? 'AI' : 'DB'}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{name.meaning}</p>
                      </div>
                      <button onClick={() => toggleSaveName(name.name)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                        <Heart className={`w-5 h-5 ${savedNames.has(name.name) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getNumerologyColor(name.numerologyValue)}`}>
                        Numerology: {name.compoundNumber}→{name.numerologyValue}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCompatibilityColor(name.compatibilityScore)}`}>
                        Match: {name.compatibilityScore}%
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{name.explanation}</p>

                    {name.externalLinks && name.externalLinks.length > 0 ? (
                      <div className="border-t border-gray-100 pt-3">
                        <button
                          onClick={() => setShowExternalLinks(showExternalLinks === name.name ? null : name.name)}
                          className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium"
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
                                className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {link.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">Fetching references...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGenerating && names.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Click "Generate Names Now" — names stream in as they're ready</p>
              <p className="text-xs mt-2 text-gray-400">Beta: new streaming engine, for comparison with the section above</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
