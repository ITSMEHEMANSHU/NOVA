'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DiscoveryFilters from '@/components/discovery/DiscoveryFilters';
import RepoCard from '@/components/discovery/RepoCard';
import IssueProofWorkflow from '@/components/issue-proof/IssueProofWorkflow';
import {
  searchRepositories,
  prepareRepository,
  getRepositoryOverview,
  getRepositoryIssues,
} from '@/lib/api';
import { RepoSearchResult, UserPreferences, RepositoryOverview, IssueItem } from '@/types';
import {
  Compass,
  ShieldCheck,
  Search,
  Zap,
  ArrowRight,
} from 'lucide-react';

const PRELOADED_REPOS = [
  'https://github.com/fastapi/fastapi',
  'https://github.com/pallets/flask',
  'https://github.com/sympy/sympy',
  'https://github.com/octocat/Hello-World',
];

export default function HomePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [repositories, setRepositories] = useState<RepoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [querySummary, setQuerySummary] = useState<string>(
    'Configure your target skills above and click "Discover Suitable Repositories" to match projects.'
  );
  const [inputError, setInputError] = useState('');

  // Dynamic Live Workbench Hero Preview States (No Mock Data)
  const [heroOverview, setHeroOverview] = useState<RepositoryOverview | null>(null);
  const [heroIssues, setHeroIssues] = useState<IssueItem[]>([]);
  const [heroLoading, setHeroLoading] = useState(false);

  const loadHeroPreview = async (owner: string, repo: string) => {
    setHeroLoading(true);
    try {
      const [ov, iss] = await Promise.all([
        getRepositoryOverview(owner, repo).catch(() => null),
        getRepositoryIssues(owner, repo).catch(() => null),
      ]);
      if (ov) setHeroOverview(ov);
      if (iss) setHeroIssues(Array.isArray(iss) ? iss : (iss.items || []));
    } catch (e) {
      console.warn('Hero preview fetch error:', e);
    } finally {
      setHeroLoading(false);
    }
  };

  const handleSearch = async (preferences: UserPreferences) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await searchRepositories(preferences);
      if (response.repositories) {
        setRepositories(response.repositories);
        setQuerySummary(response.query_summary);
      }
    } catch (err: any) {
      console.warn('Discovery search error:', err);
      setQuerySummary('Search completed. Zero cached items found for the current query.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = (targetUrl?: string) => {
    setInputError('');
    const raw = (targetUrl || repoUrl).trim();
    if (!raw) {
      setInputError('Please enter a GitHub repository URL or owner/repo');
      return;
    }

    let owner = '';
    let repo = '';

    if (raw.includes('github.com/')) {
      const parts = raw.replace(/^https?:\/\//, '').replace('github.com/', '').split('/');
      owner = parts[0];
      repo = parts[1];
    } else if (raw.includes('/')) {
      const parts = raw.split('/');
      owner = parts[0];
      repo = parts[1];
    } else {
      setInputError('Use format: owner/repository (e.g. fastapi/fastapi)');
      return;
    }

    if (!owner || !repo) {
      setInputError('Invalid repository path. Example: fastapi/fastapi');
      return;
    }

    repo = repo.replace(/\.git$/, '').replace(/\/$/, '');

    loadHeroPreview(owner, repo);
    prepareRepository(owner, repo).catch(() => {});
    router.push(`/repo/${owner}/${repo}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#DCEFFD] min-h-screen">
      {/* ========================================================
          1. HERO SECTION (SPARK LAYOUT & GENEROSITY)
          ======================================================== */}
      <section
        className="relative w-full bg-[#D5F5EF] border-b-2 border-black py-16 lg:py-24 px-6 sm:px-8 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.14) 2px, transparent 2px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10 font-mono">
          
          {/* Left Column (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 brutal-shadow-sm font-mono text-xs tracking-wider uppercase font-bold">
              <span className="w-2.5 h-2.5 bg-black" />
              <span>AI-POWERED REPOSITORY INTELLIGENCE</span>
            </div>

            {/* Headline with Stroke Effect */}
            <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight uppercase font-black text-black">
              UNDERSTAND OPEN SOURCE.{' '}<br className="hidden sm:inline" />
              <span className="text-transparent" style={{ WebkitTextStroke: '2.5px rgb(0, 0, 0)' }}>
                CONTRIBUTE
              </span>{' '}
              WITH PURPOSE.
            </h1>

            {/* Description */}
            <p className="font-body-lg text-base sm:text-lg text-slate-800 max-w-xl font-medium leading-relaxed font-sans">
              Explore any GitHub repository, demystify its architectural graph, discover module owners, and identify the exact entrypoint issue tailored to your skills using <strong className="font-bold text-black underline decoration-2 decoration-[#72C7E8]">Gemma 4</strong>.
            </p>

            {/* Input Bar */}
            <div className="w-full max-w-2xl mt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
                className="flex flex-col sm:flex-row items-stretch gap-2 bg-white border-2 border-black p-2 brutal-shadow-lg"
              >
                <div className="flex-1 flex items-center px-3 gap-2">
                  <Search className="w-4 h-4 text-black font-bold shrink-0" />
                  <input
                    className="w-full bg-transparent font-mono text-xs sm:text-sm outline-none text-black placeholder:text-slate-400 font-semibold"
                    value={repoUrl}
                    onChange={(e) => {
                      setRepoUrl(e.target.value);
                      setInputError('');
                    }}
                    placeholder="Enter GitHub URL (e.g. https://github.com/pallets/flask)"
                    type="text"
                  />
                </div>
                <button
                  type="submit"
                  className="brutal-btn bg-black text-[#72C7E8] hover:bg-[#72C7E8] hover:text-black font-mono text-xs sm:text-sm uppercase px-6 py-3.5 border-2 border-black tracking-wide font-black flex items-center justify-center gap-2 shrink-0"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ANALYZE REPOSITORY</span>
                </button>
              </form>

              {inputError && (
                <div className="mt-2 text-xs font-mono font-bold text-rose-700 bg-rose-100 border border-black px-3 py-1.5 brutal-shadow-sm">
                  ⚠️ {inputError}
                </div>
              )}

              {/* Preloaded Targets Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-3.5 font-mono text-xs">
                <span className="text-slate-700 uppercase font-black text-[11px] mr-1">
                  PRELOADED TARGETS:
                </span>
                {PRELOADED_REPOS.map((preset) => {
                  const label = preset.replace('https://github.com/', '');
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRepoUrl(preset);
                        const parts = label.split('/');
                        if (parts.length === 2) {
                          loadHeroPreview(parts[0], parts[1]);
                        }
                      }}
                      className="brutal-btn bg-white border-2 border-black px-2.5 py-1 uppercase text-xs hover:bg-black hover:text-[#72C7E8] font-bold"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Workbench Card Preview (5 Cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white border-2 border-black brutal-shadow-lg overflow-hidden">
              {/* Window Top Bar */}
              <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#e85e5e] border border-black inline-block" />
                  <span className="w-3 h-3 bg-[#72C7E8] border border-black inline-block" />
                  <span className="w-3 h-3 bg-[#42bf68] border border-black inline-block" />
                  <span className="font-mono text-xs text-slate-300 ml-2 font-bold truncate max-w-[160px]">
                    {heroOverview?.full_name || 'LIVE WORKBENCH'}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#72C7E8] uppercase font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${heroLoading ? 'bg-[#e85e5e] animate-ping' : heroOverview ? 'bg-[#10b981]' : 'bg-[#72C7E8]'}`} />
                  <span>{heroLoading ? 'QUERYING API...' : heroOverview ? 'LIVE // VERIFIED' : 'STANDBY // READY'}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col gap-4 bg-[#F9FBFD]">
                {/* Repo identity item */}
                <div className="flex items-center justify-between border-2 border-black p-3 bg-white brutal-shadow-sm font-mono">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-[#D5F5EF] border border-black flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4 text-black hover-rotate" />
                    </div>
                    <span className="text-sm font-black text-black truncate">
                      {heroOverview ? `${heroOverview.owner} / ${heroOverview.name}` : 'No target selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold shrink-0 ml-2">
                    <span className="bg-[#DCEFFD] px-2.5 py-1 border border-black">
                      ★ {heroOverview ? heroOverview.stars_count.toLocaleString() : '---'}
                    </span>
                    <span className="bg-[#D5F5EF] px-2.5 py-1 border border-black uppercase">
                      {heroOverview?.primary_language ||
                        (heroOverview?.languages && Object.keys(heroOverview.languages).length > 0
                          ? Object.keys(heroOverview.languages)[0]
                          : 'STANDBY')}
                    </span>
                  </div>
                </div>

                {/* Top Level Structure Grid */}
                <div className="border-2 border-black p-4 bg-white flex flex-col gap-2.5 font-mono">
                  <span className="text-xs uppercase text-slate-700 font-black">
                    // ARCHITECTURAL MODULES & TOPICS
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(heroOverview?.topics && heroOverview.topics.length > 0
                      ? heroOverview.topics.slice(0, 4)
                      : ['architecture', 'entrypoints', 'dependencies', 'issues']
                    ).map((t, idx) => (
                      <div
                        key={t}
                        className={`p-2.5 border ${
                          idx === 0
                            ? 'border-2 border-black bg-[#D5F5EF] font-black'
                            : 'border-black bg-[#DCEFFD] font-bold'
                        } flex items-center justify-between`}
                      >
                        <span className="truncate">/{t}</span>
                        <span className="text-[10px] bg-black text-white px-1">DIR</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Recommended Live Issue */}
                <div className="border-2 border-black p-4 bg-[#DCEFFD] brutal-shadow-sm flex flex-col gap-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black bg-black text-white px-2 py-0.5">
                      {heroOverview ? `ISSUE #${heroIssues.length > 0 ? heroIssues[0].number : (heroOverview.open_issues_count || 1)}` : 'WORKBENCH READY'}
                    </span>
                    <span className="text-xs bg-[#72C7E8] text-black px-2 py-0.5 border border-black font-black uppercase">
                      {heroIssues.length > 0 && heroIssues[0].difficulty?.level
                        ? heroIssues[0].difficulty.level.toUpperCase()
                        : 'ENTRYPOINT'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-black mt-1 truncate">
                    {heroIssues.length > 0
                      ? heroIssues[0].title
                      : heroOverview?.description || 'Select a preloaded target or enter a GitHub repository above'}
                  </div>
                  <div className="text-[11px] text-slate-700 font-sans line-clamp-1">
                    {heroIssues.length > 0 && heroIssues[0].difficulty?.rationale
                      ? heroIssues[0].difficulty.rationale
                      : 'Analyze any repository to preview its live architectural tree, issues, and contributor graph.'}
                  </div>
                </div>

                {/* Action Link */}
                {heroOverview ? (
                  <Link
                    href={`/repo/${heroOverview.owner}/${heroOverview.name}`}
                    className="brutal-btn w-full flex items-center justify-center gap-2 py-3 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black font-mono font-black text-xs uppercase border-2 border-black brutal-shadow-sm"
                  >
                    <span>Open Live Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (repoUrl.trim()) {
                        handleAnalyze();
                      } else {
                        const defaultTarget = PRELOADED_REPOS[0];
                        setRepoUrl(defaultTarget);
                        loadHeroPreview('fastapi', 'fastapi');
                      }
                    }}
                    className="brutal-btn w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-[#D5F5EF] text-black font-mono font-black text-xs uppercase border-2 border-black brutal-shadow-sm"
                  >
                    <span>Select Target Above to Open</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          2. DISCOVERY FORM SECTION (SPARK UN-CROWDED)
          ======================================================== */}
      <section className="w-full py-16 px-6 sm:px-8 max-w-[1440px] mx-auto font-mono space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black border-2 border-black flex items-center justify-center shrink-0 brutal-shadow-sm">
              <Search className="w-4 h-4 text-[#72C7E8]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                Profile-Based Repository Discovery
              </h2>
              <p className="text-xs text-slate-700 font-bold font-sans mt-0.5">
                Configure your target languages, tools, and GSoC interest for personalized fit scoring.
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 bg-[#D5F5EF] border-2 border-black brutal-shadow-sm">
            STEP 01
          </span>
        </div>

        <DiscoveryFilters onSearch={handleSearch} isLoading={isSearching} />
      </section>

      {/* ========================================================
          3. RECOMMENDED REPOSITORIES (3-COLUMN RESPONSIVE GRID)
          ======================================================== */}
      <section id="demo-repos" className="w-full py-12 px-6 sm:px-8 max-w-[1440px] mx-auto font-mono space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black border-2 border-black flex items-center justify-center shrink-0 brutal-shadow-sm">
              <Compass className="w-4 h-4 text-[#72C7E8]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                Matched Open-Source Projects
              </h2>
              <p className="text-xs text-slate-700 font-bold font-sans mt-0.5">{querySummary}</p>
            </div>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 bg-white border-2 border-black brutal-shadow-sm text-black self-start sm:self-auto uppercase">
            {hasSearched ? `${repositories.length} PROJECTS RANKED` : 'READY TO SEARCH'}
          </span>
        </div>

        {/* Live GitHub Data Grid */}
        {isSearching && repositories.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="brutal-card bg-white p-6 sm:p-7 space-y-4 animate-pulse">
                <div className="h-6 bg-slate-200 border-2 border-black w-2/3" />
                <div className="h-16 bg-slate-100 border border-black" />
                <div className="h-10 bg-[#DCEFFD] border border-black" />
                <div className="h-8 bg-[#D5F5EF] border border-black w-1/2" />
              </div>
            ))}
          </div>
        ) : repositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {repositories.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : !hasSearched ? (
          <div className="brutal-card bg-white p-12 text-center space-y-3">
            <div className="inline-flex p-3 bg-[#DCEFFD] border-2 border-black brutal-shadow-sm mb-1">
              <Compass className="w-6 h-6 text-black" />
            </div>
            <p className="text-sm font-black uppercase text-black">
              Ready to Discover Repositories
            </p>
            <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
              Select your target languages, frameworks, or contribution preferences above and click &quot;Discover Suitable Repositories&quot; to begin.
            </p>
          </div>
        ) : (
          <div className="brutal-card bg-white p-14 text-center space-y-2">
            <p className="text-sm font-black uppercase text-black">
              No matching repositories returned by GitHub search.
            </p>
            <p className="text-xs font-sans text-slate-600">
              Try modifying your language selections or broadening your search criteria above.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================
          4. ISSUEPROOF WORKFLOW SECTION (FULL WIDTH)
          ======================================================== */}
      <section
        id="issue-proof"
        className="w-full py-16 px-6 sm:px-8 border-t-2 border-black bg-[#D5F5EF] neo-dots-subtle font-mono"
      >
        <div className="max-w-[1440px] mx-auto space-y-8">
          <div className="flex items-center justify-between border-b-2 border-black pb-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3 py-1 brutal-shadow-sm text-xs font-black uppercase mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>Evidence-Based Contribution Tool</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-black tracking-tight uppercase">
                IssueProof — Verify Bug Observations Before Submitting
              </h2>
              <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 max-w-2xl mt-1 leading-relaxed">
                Audit your draft observations against repository realities. Gemma 4 identifies missing reproduction steps and environment gaps, generating a maintainer-ready GitHub Markdown issue.
              </p>
            </div>
            <span className="text-xs font-black px-3.5 py-1.5 bg-[#72C7E8] border-2 border-black brutal-shadow-sm">
              STEP 05
            </span>
          </div>

          <IssueProofWorkflow owner="fastapi" repo="fastapi" />
        </div>
      </section>

      {/* ========================================================
          5. COMPACT MULTI-COLUMN FOOTER
          ======================================================== */}
      <footer className="border-t-2 border-black bg-white pt-14 pb-16 font-mono text-xs text-black">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center brutal-shadow-sm">
                <Compass className="w-4 h-4 text-[#72C7E8]" />
              </div>
              <span className="font-black text-base tracking-tight uppercase">OSS Compass</span>
            </div>
            <p className="text-xs font-sans text-slate-700 leading-relaxed font-medium">
              Grounded, evidence-based AI assistant for developer onboarding and meaningful open-source contributions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-black uppercase tracking-wider text-black text-xs border-b-2 border-black pb-1.5">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-xs font-bold text-slate-800">
              <li>
                <Link href="/" className="hover:underline">
                  ➔ Repository Discovery
                </Link>
              </li>
              <li>
                <Link href="/#demo-repos" className="hover:underline">
                  ➔ Matched Repositories
                </Link>
              </li>
              <li>
                <Link href="/#issue-proof" className="hover:underline">
                  ➔ IssueProof Generator
                </Link>
              </li>
              <li>
                <Link href="/repo/fastapi/fastapi" className="hover:underline">
                  ➔ Live Workspace
                </Link>
              </li>
            </ul>
          </div>

          {/* Technical Stack */}
          <div className="space-y-2.5">
            <h4 className="font-black uppercase tracking-wider text-black text-xs border-b-2 border-black pb-1.5">
              Architecture Stack
            </h4>
            <ul className="space-y-1.5 text-xs font-bold text-slate-800">
              <li>• Model: Gemma 4 (31B-IT)</li>
              <li>• Orchestration: Trigger.dev v3</li>
              <li>• Cache: Layerbase Redis</li>
              <li>• Backend: FastAPI (Python 3.12)</li>
              <li>• Frontend: Next.js 16 + XYFlow</li>
            </ul>
          </div>

          {/* Hackathon Specs */}
          <div className="space-y-2.5">
            <h4 className="font-black uppercase tracking-wider text-black text-xs border-b-2 border-black pb-1.5">
              HackDay VU
            </h4>
            <div className="p-3 bg-[#DCEFFD] border-2 border-black brutal-shadow-sm text-xs leading-relaxed">
              <p className="font-black mb-1">Verifiable Grounding:</p>
              <p className="text-slate-700 font-sans">GitHub API supplies verified facts; Gemma 4 interprets code architecture without hallucinating.</p>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 mt-12 pt-6 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <p>© 2026 OSS COMPASS • LIGHT NEO-BRUTALIST ARCHITECTURE</p>
          <p className="font-bold text-black">DESIGN SYSTEM: SPARK GEOMETRY • PALETTE: AQUA / SKY BLUE</p>
        </div>
      </footer>
    </div>
  );
}
