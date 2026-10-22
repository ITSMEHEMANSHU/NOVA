'use client';

import React, { useState } from 'react';
import { UserPreferences, ExperienceLevel } from '@/types';
import { Search, Sparkles, Award, Sliders, CheckSquare, Layers } from 'lucide-react';

interface DiscoveryFiltersProps {
  onSearch: (preferences: UserPreferences) => void;
  isLoading: boolean;
}

const COMMON_LANGUAGES = ['Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'C++', 'Ruby'];
const COMMON_FRAMEWORKS = ['React', 'FastAPI', 'Next.js', 'Node.js', 'Django', 'Tailwind', 'Docker'];

export default function DiscoveryFilters({ onSearch, isLoading }: DiscoveryFiltersProps) {
  const [languages, setLanguages] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [contributionTypes, setContributionTypes] = useState<string[]>([]);
  const [gsocInterest, setGsocInterest] = useState<boolean>(false);
  const [customLanguage, setCustomLanguage] = useState<string>('');

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const toggleFramework = (fw: string) => {
    if (frameworks.includes(fw)) {
      setFrameworks(frameworks.filter((f) => f !== fw));
    } else {
      setFrameworks([...frameworks, fw]);
    }
  };

  const toggleContributionType = (ct: string) => {
    if (contributionTypes.includes(ct)) {
      setContributionTypes(contributionTypes.filter((t) => t !== ct));
    } else {
      setContributionTypes([...contributionTypes, ct]);
    }
  };

  const handleCustomLangAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customLanguage.trim()) {
      e.preventDefault();
      const val = customLanguage.trim();
      if (!languages.includes(val)) {
        setLanguages([...languages, val]);
      }
      setCustomLanguage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      languages,
      frameworks,
      experience_level: experience || 'beginner',
      interests: ['web', 'devtools'],
      contribution_types: contributionTypes,
      gsoc_interest: gsocInterest,
      min_stars: 10,
    });
  };

  const applyPreset = (preset: 'python_beginner' | 'ts_react' | 'gsoc_focus') => {
    if (preset === 'python_beginner') {
      setLanguages(['Python']);
      setFrameworks(['FastAPI']);
      setExperience('beginner');
      setContributionTypes(['bugs', 'documentation']);
      setGsocInterest(false);
      onSearch({
        languages: ['Python'],
        frameworks: ['FastAPI'],
        experience_level: 'beginner',
        interests: ['web', 'devtools'],
        contribution_types: ['bugs', 'documentation'],
        gsoc_interest: false,
      });
    } else if (preset === 'ts_react') {
      setLanguages(['TypeScript', 'JavaScript']);
      setFrameworks(['React', 'Next.js']);
      setExperience('intermediate');
      setContributionTypes(['bugs', 'features']);
      setGsocInterest(false);
      onSearch({
        languages: ['TypeScript', 'JavaScript'],
        frameworks: ['React', 'Next.js'],
        experience_level: 'intermediate',
        interests: ['web', 'ui'],
        contribution_types: ['bugs', 'features'],
        gsoc_interest: false,
      });
    } else if (preset === 'gsoc_focus') {
      setLanguages(['Python', 'C++']);
      setFrameworks([]);
      setExperience('intermediate');
      setContributionTypes(['bugs', 'features', 'tests']);
      setGsocInterest(true);
      onSearch({
        languages: ['Python', 'C++'],
        frameworks: [],
        experience_level: 'intermediate',
        interests: ['open-source'],
        contribution_types: ['bugs', 'features', 'tests'],
        gsoc_interest: true,
      });
    }
  };

  return (
    <div className="bg-white border-2 border-black brutal-shadow-lg p-6 sm:p-10 font-mono space-y-8">
      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pb-6 border-b-2 border-black/20">
        <span className="text-xs font-black text-black uppercase tracking-wider mr-2 flex items-center">
          <Sliders className="w-4 h-4 mr-1.5 text-black" />
          Preset Profiles:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('python_beginner')}
          className="brutal-btn text-xs font-black px-3.5 py-1.5 bg-white hover:bg-[#D5F5EF] text-black border-2 border-black brutal-shadow-sm"
        >
          🐍 Python Beginner
        </button>
        <button
          type="button"
          onClick={() => applyPreset('ts_react')}
          className="brutal-btn text-xs font-black px-3.5 py-1.5 bg-white hover:bg-[#DCEFFD] text-black border-2 border-black brutal-shadow-sm"
        >
          ⚛️ TypeScript & React
        </button>
        <button
          type="button"
          onClick={() => applyPreset('gsoc_focus')}
          className="brutal-btn text-xs font-black px-3.5 py-1.5 bg-[#D5F5EF] hover:bg-[#72C7E8] text-black border-2 border-black brutal-shadow-sm"
        >
          ☀️ GSoC Organizations
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Target Languages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wide text-black flex items-center">
              <span className="bg-[#72C7E8] border-2 border-black px-2 py-0.5 mr-2 text-xs">01</span>
              Target Languages
            </label>
            <span className="text-xs text-slate-600 font-bold">Select one or more</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {COMMON_LANGUAGES.map((lang) => {
              const active = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`brutal-btn text-xs sm:text-sm px-4 py-2 font-black border-2 border-black transition-all cursor-pointer ${
                    active
                      ? 'bg-[#72C7E8] text-black brutal-shadow-sm'
                      : 'bg-white text-black hover:bg-[#D5F5EF] brutal-shadow-sm'
                  }`}
                >
                  {active ? `✓ ${lang}` : lang}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <input
              type="text"
              placeholder="Type another language and hit Enter (e.g. C#, Kotlin)..."
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              onKeyDown={handleCustomLangAdd}
              className="w-full sm:w-96 px-4 py-2.5 text-xs sm:text-sm bg-white border-2 border-black rounded-none text-black placeholder-slate-400 font-mono font-bold brutal-shadow-sm focus:outline-none focus:bg-[#D5F5EF]"
            />
          </div>
        </div>

        {/* Section 2: Frameworks & Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wide text-black flex items-center">
              <span className="bg-[#D5F5EF] border-2 border-black px-2 py-0.5 mr-2 text-xs">02</span>
              Frameworks & Ecosystems (Optional)
            </label>
            <span className="text-xs text-slate-600 font-bold">Refine match precision</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {COMMON_FRAMEWORKS.map((fw) => {
              const active = frameworks.includes(fw);
              return (
                <button
                  key={fw}
                  type="button"
                  onClick={() => toggleFramework(fw)}
                  className={`brutal-btn text-xs sm:text-sm px-4 py-2 font-black border-2 border-black transition-all cursor-pointer ${
                    active
                      ? 'bg-[#72C7E8] text-black brutal-shadow-sm'
                      : 'bg-white text-black hover:bg-[#DCEFFD] brutal-shadow-sm'
                  }`}
                >
                  {active ? `✓ ${fw}` : fw}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3 & 4: Two-Column Grouping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Experience level */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wide text-black flex items-center">
              <span className="bg-[#DCEFFD] border-2 border-black px-2 py-0.5 mr-2 text-xs">03</span>
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperience(experience === lvl ? null : lvl)}
                  className={`brutal-btn py-3 text-xs sm:text-sm font-black uppercase border-2 border-black transition-all cursor-pointer ${
                    experience === lvl
                      ? 'bg-[#72C7E8] text-black brutal-shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 brutal-shadow-sm'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Contribution types & GSoC */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-black uppercase tracking-wide text-black flex items-center">
              <span className="bg-[#D5F5EF] border-2 border-black px-2 py-0.5 mr-2 text-xs">04</span>
              Preferred Contribution Types
            </label>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'bugs', label: 'Bug Fixes' },
                { id: 'documentation', label: 'Docs' },
                { id: 'features', label: 'Features' },
                { id: 'tests', label: 'Testing' },
              ].map((item) => (
                <label
                  key={item.id}
                  className="brutal-btn flex items-center space-x-2 text-xs sm:text-sm font-bold text-black cursor-pointer select-none bg-white px-3.5 py-2 border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={contributionTypes.includes(item.id)}
                    onChange={() => toggleContributionType(item.id)}
                    className="w-4 h-4 border-2 border-black text-[#72C7E8] focus:ring-0 cursor-pointer accent-black"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {/* GSoC Checkbox Card */}
            <div className="p-3.5 bg-[#D5F5EF] border-2 border-black brutal-shadow-sm flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-black flex items-center">
                <Award className="w-4 h-4 text-black mr-2" />
                Prioritize GSoC Organizations
              </span>
              <input
                type="checkbox"
                checked={gsocInterest}
                onChange={(e) => setGsocInterest(e.target.checked)}
                className="w-5 h-5 border-2 border-black text-[#72C7E8] focus:ring-0 cursor-pointer accent-black"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t-2 border-black/20 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="brutal-btn flex items-center space-x-2 px-8 py-4 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black font-black text-sm uppercase tracking-wider border-2 border-black brutal-shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Scanning GitHub & GSoC...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Discover Suitable Repositories</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
