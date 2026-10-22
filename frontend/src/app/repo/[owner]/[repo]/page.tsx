'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  getRepositoryOverview,
  getRepositoryStatus,
  getRepositoryGraph,
  getRepositoryTree,
  getRepositoryIssues,
  getRepositoryContributors,
  getRepositoryPulls,
  prepareRepository,
} from '@/lib/api';
import {
  RepositoryOverview,
  RepoSectionStatus,
  ArchitectureGraph,
  RepositoryTreeResponse,
  IssueItem,
  PaginatedIssuesResponse,
  Contributor,
  PullRequest,
  PaginatedPullsResponse,
} from '@/types';
import ArchitectureGraphView from '@/components/graph/ArchitectureGraphView';
import IssueAnalysisModal from '@/components/issues/IssueAnalysisModal';
import IssueProofWorkflow from '@/components/issue-proof/IssueProofWorkflow';
import {
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Network,
  Users,
  FolderTree,
  FileCode,
  FileText,
  Sparkles,
  ArrowLeft,
  GitPullRequest,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Activity,
  Layers,
  Terminal,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Search,
  Folder,
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default function RepoWorkspacePage({ params }: PageProps) {
  const { owner, repo } = use(params);

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'tree' | 'issues' | 'contributors' | 'pulls' | 'issue_proof'>('overview');
  const [overview, setOverview] = useState<RepositoryOverview | null>(null);
  const [status, setStatus] = useState<RepoSectionStatus | null>(null);
  const [graph, setGraph] = useState<ArchitectureGraph | null>(null);
  const [tree, setTree] = useState<RepositoryTreeResponse | null>(null);
  const [issuesData, setIssuesData] = useState<PaginatedIssuesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [issuesPerPage, setIssuesPerPage] = useState<number>(25);
  const [isLoadingIssues, setIsLoadingIssues] = useState<boolean>(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [pullsData, setPullsData] = useState<PaginatedPullsResponse | null>(null);
  const [currentPullsPage, setCurrentPullsPage] = useState<number>(1);
  const [pullsPerPage, setPullsPerPage] = useState<number>(20);
  const [pullsFilter, setPullsFilter] = useState<'all' | 'open' | 'merged' | 'closed'>('all');
  const [isLoadingPulls, setIsLoadingPulls] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected issue for Gemma 4 analysis
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  // Filter state for issues
  const [issueFilter, setIssueFilter] = useState<'all' | 'gfi' | 'beginner' | 'intermediate'>('all');

  // Search filter for repository file tree
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  const issues = issuesData?.items || [];
  const totalIssuesCount = issuesData?.total_count ?? (overview?.open_issues_count || 0);
  const totalPages = issuesData?.total_pages ?? Math.max(1, Math.ceil(totalIssuesCount / issuesPerPage));

  const pulls = pullsData?.items || [];
  const totalPullsCount = pullsData?.total_count ?? 0;
  const totalPullsPages = pullsData?.total_pages ?? Math.max(1, Math.ceil(totalPullsCount / pullsPerPage));

  const fetchIssues = async (page: number, perPage: number = issuesPerPage) => {
    setIsLoadingIssues(true);
    try {
      const res = await getRepositoryIssues(owner, repo, page, perPage);
      setIssuesData(res);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    fetchIssues(newPage, issuesPerPage);
    const el = document.getElementById('issues-list-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    if (newPerPage === issuesPerPage) return;
    setIssuesPerPage(newPerPage);
    fetchIssues(1, newPerPage);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const fetchPulls = async (
    page: number,
    perPage: number = pullsPerPage,
    state: 'all' | 'open' | 'merged' | 'closed' = pullsFilter
  ) => {
    setIsLoadingPulls(true);
    try {
      const res = await getRepositoryPulls(owner, repo, page, perPage, state);
      setPullsData(res);
      setCurrentPullsPage(page);
    } catch (err) {
      console.error('Failed to fetch pulls', err);
    } finally {
      setIsLoadingPulls(false);
    }
  };

  const handlePullsPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPullsPages || newPage === currentPullsPage) return;
    fetchPulls(newPage, pullsPerPage, pullsFilter);
    const el = document.getElementById('pulls-list-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePullsPerPageChange = (newPerPage: number) => {
    if (newPerPage === pullsPerPage) return;
    setPullsPerPage(newPerPage);
    fetchPulls(1, newPerPage, pullsFilter);
  };

  const handlePullsFilterChange = (newFilter: 'all' | 'open' | 'merged' | 'closed') => {
    if (newFilter === pullsFilter) return;
    setPullsFilter(newFilter);
    fetchPulls(1, pullsPerPage, newFilter);
  };

  const getPullsPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPullsPages <= 7) {
      for (let i = 1; i <= totalPullsPages; i++) pages.push(i);
    } else {
      if (currentPullsPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPullsPages);
      } else if (currentPullsPage >= totalPullsPages - 3) {
        pages.push(1, '...', totalPullsPages - 4, totalPullsPages - 3, totalPullsPages - 2, totalPullsPages - 1, totalPullsPages);
      } else {
        pages.push(1, '...', currentPullsPage - 1, currentPullsPage, currentPullsPage + 1, '...', totalPullsPages);
      }
    }
    return pages;
  };

  // Initial load & trigger preparation
  useEffect(() => {
    prepareRepository(owner, repo).catch(() => {});

    // Poll status initially
    const statusInterval = setInterval(() => {
      getRepositoryStatus(owner, repo).then(setStatus).catch(() => {});
    }, 2000);

    // Fetch Overview immediately
    getRepositoryOverview(owner, repo)
      .then(setOverview)
      .catch((err) => console.error('Overview error', err));

    return () => clearInterval(statusInterval);
  }, [owner, repo]);

  // Progressive loading as user switches tabs
  useEffect(() => {
    if (activeTab === 'graph' && !graph) {
      getRepositoryGraph(owner, repo).then(setGraph).catch(console.error);
    } else if (activeTab === 'tree' && !tree) {
      getRepositoryTree(owner, repo).then(setTree).catch(console.error);
    } else if (activeTab === 'issues' && !issuesData) {
      fetchIssues(1, issuesPerPage);
    } else if (activeTab === 'contributors' && contributors.length === 0) {
      getRepositoryContributors(owner, repo).then(setContributors).catch(console.error);
    } else if (activeTab === 'pulls' && !pullsData) {
      fetchPulls(1, pullsPerPage, pullsFilter);
    }
  }, [activeTab, owner, repo, graph, tree, issuesData, contributors.length, pullsData, issuesPerPage, pullsPerPage, pullsFilter]);

  // Pre-load graph in background after overview arrives
  useEffect(() => {
    if (overview && !graph) {
      getRepositoryGraph(owner, repo).then(setGraph).catch(() => {});
    }
  }, [overview, graph, owner, repo]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await prepareRepository(owner, repo);
      const [ov, gr, tr, is] = await Promise.all([
        getRepositoryOverview(owner, repo),
        getRepositoryGraph(owner, repo),
        getRepositoryTree(owner, repo),
        getRepositoryIssues(owner, repo, 1, issuesPerPage),
      ]);
      setOverview(ov);
      setGraph(gr);
      setTree(tr);
      setIssuesData(is);
      setCurrentPage(1);
    } catch (e) {
      console.error('Refresh error', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (issueFilter === 'gfi') return iss.is_good_first_issue;
    if (issueFilter === 'beginner') return iss.difficulty?.level === 'beginner';
    if (issueFilter === 'intermediate') return iss.difficulty?.level === 'intermediate';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#DCEFFD] text-black flex flex-col font-mono pb-20">
      {/* Top Workspace Header Bar */}
      <div className="border-b-2 border-black bg-white shadow-[0px_3px_0px_0px_#000000]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 mb-1">
                <Link href="/" className="hover:text-black flex items-center">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Discovery
                </Link>
                <span>/</span>
                <span>{owner}</span>
                <span>/</span>
                <span className="text-black font-black">{repo}</span>
              </div>

              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">
                  {repo}
                </h1>
                <a
                  href={`https://github.com/${owner}/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-btn p-2 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] text-black transition-all cursor-pointer"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Telemetry Status Badge */}
                <span className="text-xs font-black px-2.5 py-1 bg-[#D5F5EF] border-2 border-black brutal-shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                  <span>{status?.graph === 'ready' ? 'AST READY' : 'TRIGGER SYNC'}</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-black">
              {overview && (
                <>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>{overview.stars_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm">
                    <GitFork className="w-3.5 h-3.5" />
                    <span>{overview.forks_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#D5F5EF] border-2 border-black brutal-shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{overview.open_issues_count} issues</span>
                  </div>
                  {overview.license && (
                    <div className="hidden sm:block px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm">
                      {overview.license}
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="brutal-btn px-3 py-1.5 bg-white hover:bg-[#D5F5EF] text-black border-2 border-black brutal-shadow-sm flex items-center space-x-1"
                title="Refresh from GitHub and Trigger.dev"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (SPARK Style) */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs font-black uppercase">
            {[
              { id: 'overview', label: '01. Overview', icon: BookOpen },
              { id: 'graph', label: '02. Architecture Graph', icon: Network },
              { id: 'issues', label: '03. Issues & AI Plans', icon: AlertCircle, count: totalIssuesCount || overview?.open_issues_count },
              { id: 'tree', label: '04. File Structure', icon: FolderTree },
              { id: 'contributors', label: '05. Contributors', icon: Users },
              { id: 'pulls', label: '06. Pull Requests', icon: GitPullRequest },
              { id: 'issue_proof', label: '07. IssueProof', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`brutal-btn flex items-center space-x-2 px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all whitespace-nowrap ${
                    active
                      ? 'bg-black text-[#72C7E8]'
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 border border-black ${
                        active ? 'bg-[#72C7E8] text-black' : 'bg-[#DCEFFD] text-black'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-8 py-8 space-y-6">
        
        {/* ========================================================
            GEMMA 4 ARCHITECTURAL OVERVIEW SUMMARY BANNER
            ======================================================== */}
        <div className="border-2 border-black bg-[#72C7E8] p-6 brutal-shadow-md">
          <div className="font-mono text-xs font-black bg-black text-[#72C7E8] inline-block px-3 py-1 uppercase mb-2.5">
            // GEMMA 4 VERIFIED ARCHITECTURAL SUMMARY
          </div>
          <p className="text-sm md:text-base font-sans text-black font-medium max-w-4xl leading-relaxed">
            {overview?.description || 'Repository metadata and AST graph parsed. Use the interactive architecture diagram below to identify entry points, or inspect open issues for guided contribution roadmaps.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t-2 border-black font-mono text-xs font-bold">
            <div>
              <strong className="uppercase text-black">Primary Stack: </strong>
              <span>
                {overview?.primary_language ||
                  (overview?.languages && Object.keys(overview.languages).length > 0
                    ? Object.keys(overview.languages)[0]
                    : 'Python')}
              </span>
            </div>
            <div>
              <strong className="uppercase text-black">Architecture Pattern: </strong>
              <span>Modular Subsystems / AST Import Graph</span>
            </div>
            <div>
              <strong className="uppercase text-black">Recommended Entrypoint: </strong>
              <span className="bg-black text-[#72C7E8] px-1.5 py-0.5 font-bold">
                {overview?.default_branch ? `${overview.default_branch}/README.md` : 'README.md'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            TAB 1: OVERVIEW (SPLIT PANE: SIDEBAR + MAIN READ ME)
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Panel (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Repo Summary Card */}
              <div className="brutal-card bg-white p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b-2 border-black/15 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-black flex items-center">
                    <Activity className="w-4 h-4 mr-1.5 text-black" />
                    Repository Identity
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#D5F5EF] border border-black font-bold">
                    {overview?.default_branch || 'main'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans">
                  {overview?.description || 'No description provided by maintainers.'}
                </p>

                {/* Languages Breakdown */}
                {overview && Object.keys(overview.languages).length > 0 && (
                  <div className="pt-2.5 border-t border-black/15">
                    <div className="text-xs font-black uppercase text-black mb-2">Languages:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(overview.languages).map(([lang, bytes]) => (
                        <span
                          key={lang}
                          className="text-xs font-bold px-2.5 py-1 bg-[#DCEFFD] border border-black text-black"
                        >
                          {lang} ({(bytes / 1024).toFixed(0)} KB)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Gemma 4 Quick Guidance Card */}
              <div className="brutal-card bg-[#D5F5EF] p-5 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-black" />
                  Gemma 4 Contribution Path
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans">
                  This repository has a verified contributing guide. Start by exploring the AST architecture graph to identify entry point modules, or audit your findings using IssueProof.
                </p>
                <div className="pt-2 flex items-center space-x-2.5">
                  <button
                    onClick={() => setActiveTab('graph')}
                    className="brutal-btn px-3 py-1.5 bg-white hover:bg-[#DCEFFD] text-black text-xs font-black uppercase border border-black"
                  >
                    View Graph ➔
                  </button>
                  <button
                    onClick={() => setActiveTab('issue_proof')}
                    className="brutal-btn px-3 py-1.5 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black text-xs font-black uppercase border border-black"
                  >
                    IssueProof ➔
                  </button>
                </div>
              </div>

              {/* Quick File Explorer Snippet */}
              {tree && (
                <div className="brutal-card bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black/15 pb-2.5">
                    <span className="text-xs font-black uppercase text-black flex items-center">
                      <FolderTree className="w-4 h-4 mr-1.5 text-black" />
                      Top Files ({tree.files.length})
                    </span>
                    <button
                      onClick={() => setActiveTab('tree')}
                      className="text-xs font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto">
                    {tree.files.slice(0, 10).map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-[#DCEFFD] border-b border-black/5">
                        <span className="truncate">{file.path}</span>
                        {file.size && (
                          <span className="text-[10px] text-slate-600 shrink-0 ml-2">
                            {(file.size / 1024).toFixed(0)}KB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Main Pane: README.md (8 Cols) */}
            <div className="lg:col-span-8">
              {overview?.readme_markdown ? (
                <div className="brutal-card bg-white p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b-2 border-black">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-[#D5F5EF] border-2 border-black flex items-center justify-center brutal-shadow-sm">
                        <FileText className="w-4 h-4 text-black" />
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-black uppercase">
                        README.md
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-600">GitHub Default Branch</span>
                  </div>
                  <pre className="text-xs sm:text-sm text-black font-mono whitespace-pre-wrap leading-relaxed max-h-[650px] overflow-y-auto bg-[#F8FCFE] p-5 border-2 border-black">
                    {overview.readme_markdown}
                  </pre>
                </div>
              ) : (
                <div className="brutal-card bg-white p-14 text-center text-slate-600 text-xs font-bold">
                  {overview ? 'No README found in this repository.' : 'Loading repository overview...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ARCHITECTURE GRAPH
            ======================================================== */}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center">
                  <Network className="w-4 h-4 mr-1.5" />
                  AST Architecture & Dependency Graph
                </h2>
                <p className="text-xs text-slate-700">
                  AST import relations parsed deterministically. Click any node to inspect modules and dependencies.
                </p>
              </div>
            </div>

            {graph ? (
              <ArchitectureGraphView graph={graph} owner={owner} repo={repo} />
            ) : (
              <div className="py-24 text-center brutal-card bg-white">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-black uppercase">
                  Parsing AST and building architecture graph...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: ISSUES & GEMMA 4 PLANS
            ======================================================== */}
        {activeTab === 'issues' && (
          <div id="issues-list-container" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-black" />
                  Issues & Gemma 4 Guided Plans
                </h2>
                <p className="text-xs text-slate-700 font-sans mt-0.5">
                  Showing {totalIssuesCount > 0 ? `${(currentPage - 1) * issuesPerPage + 1}-${Math.min(currentPage * issuesPerPage, totalIssuesCount)} of ${totalIssuesCount}` : issues.length} open issues • Page {currentPage} of {totalPages}
                </p>
              </div>

              {/* Filters & Per Page Toggle */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setIssueFilter('all')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      issueFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    All ({issues.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter('gfi')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      issueFilter === 'gfi' ? 'bg-[#D5F5EF] text-black' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    Good First Issues
                  </button>
                  <button
                    onClick={() => setIssueFilter('beginner')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      issueFilter === 'beginner' ? 'bg-[#DCEFFD] text-black' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    Beginner Friendly
                  </button>
                </div>

                {/* Per Page Toggle */}
                <div className="flex items-center space-x-1 pl-2 border-l-2 border-black/30">
                  <span className="text-[11px] text-slate-700 uppercase">Per page:</span>
                  {[25, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePerPageChange(size)}
                      className={`px-2 py-1 border-2 border-black text-xs font-black transition-all ${
                        issuesPerPage === size ? 'bg-black text-[#72C7E8]' : 'bg-white text-black hover:bg-slate-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoadingIssues && (
              <div className="p-3 bg-[#D5F5EF] border-2 border-black brutal-shadow-sm flex items-center justify-center space-x-2 text-xs font-black">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Loading page {currentPage} from GitHub API...</span>
              </div>
            )}

            {/* Issues List */}
            {issues.length > 0 ? (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="brutal-card bg-white p-5 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000000] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-black text-black">
                          #{issue.number}
                        </span>
                        <h4 className="text-sm font-black text-black group-hover:text-[#0284c7] transition-colors">
                          {issue.title}
                        </h4>

                        {issue.is_good_first_issue && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-[#D5F5EF] text-black border border-black uppercase">
                            good first issue
                          </span>
                        )}

                        {issue.difficulty && (
                          <span className="text-[10px] font-black px-2 py-0.5 capitalize bg-[#DCEFFD] text-black border border-black">
                            AI: {issue.difficulty.level}
                          </span>
                        )}
                      </div>

                      {issue.difficulty && (
                        <p className="text-xs text-slate-700 line-clamp-1 font-sans">
                          {issue.difficulty.rationale}
                        </p>
                      )}

                      {/* Labels */}
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {issue.labels.slice(0, 4).map((label) => (
                            <span
                              key={label}
                              className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-black border border-black"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right text-xs font-bold text-slate-600 hidden sm:block">
                        <div>{new Date(issue.updated_at).toLocaleDateString()}</div>
                        <div>{issue.comments_count} comments</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                        className="brutal-btn flex items-center space-x-1.5 px-3.5 py-2 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black text-xs font-black uppercase border-2 border-black brutal-shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemma 4 Plan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Neo-brutalist Pagination Bar */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-black">
                    <div className="text-xs font-bold text-black">
                      Showing Page <strong className="font-black">{currentPage}</strong> of{' '}
                      <strong className="font-black">{totalPages}</strong> ({totalIssuesCount} total issues)
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs font-black">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingIssues}
                        className="brutal-btn px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {getPageNumbers().map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`dots-${idx}`} className="px-2 py-1 text-black font-bold">
                                ...
                              </span>
                            );
                          }
                          const pageNum = p as number;
                          const isCurrent = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              disabled={isLoadingIssues}
                              className={`brutal-btn min-w-[32px] h-[32px] px-2 text-xs font-black border-2 border-black brutal-shadow-sm transition-all ${
                                isCurrent
                                  ? 'bg-black text-[#72C7E8]'
                                  : 'bg-white text-black hover:bg-[#DCEFFD]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoadingIssues}
                        className="brutal-btn px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Next Page"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center brutal-card bg-white">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-black uppercase">Fetching open GitHub issues...</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: FILE TREE (HIERARCHICAL INDENTATION)
            ======================================================== */}
        {activeTab === 'tree' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center">
                  <FolderTree className="w-4 h-4 mr-1.5" />
                  Repository File Hierarchy
                </h2>
                <span className="text-xs font-bold text-slate-600">
                  {tree ? `${tree.total_files || tree.files.length} Files Discovered (Branch: ${tree.branch})` : 'Scanning git tree...'}
                </span>
              </div>

              {tree && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter files (e.g. .cpp, test)..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-white border-2 border-black text-xs font-mono brutal-shadow-sm focus:outline-none min-w-[220px]"
                    />
                  </div>
                  {fileSearchQuery && (
                    <button
                      onClick={() => setFileSearchQuery('')}
                      className="brutal-btn px-2.5 py-1.5 bg-white border-2 border-black text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {tree ? (
              <div className="brutal-card bg-white p-5 max-h-[650px] overflow-y-auto space-y-0.5 text-xs">
                {(() => {
                  const filtered = tree.files.filter((f) =>
                    !fileSearchQuery || f.path.toLowerCase().includes(fileSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs font-bold text-slate-600">
                        No files matched &ldquo;{fileSearchQuery}&rdquo;
                      </div>
                    );
                  }

                  return filtered.map((file, idx) => {
                    const parts = file.path.split('/');
                    const depth = fileSearchQuery ? 0 : parts.length - 1;
                    const displayName = file.name || parts[parts.length - 1];
                    const isDir = file.type === 'directory';

                    return (
                      <div
                        key={idx}
                        style={{ paddingLeft: `${depth * 20 + 8}px` }}
                        className={`flex items-center justify-between py-1.5 pr-3 hover:bg-[#D5F5EF] transition-colors border-b border-black/5 group ${
                          isDir ? 'bg-slate-50/70 font-black text-black' : 'text-slate-800 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {/* Tree guide connector */}
                          {depth > 0 && !fileSearchQuery && (
                            <span className="text-slate-400 font-mono select-none text-[11px] shrink-0">
                              └─
                            </span>
                          )}

                          {isDir ? (
                            <Folder className="w-3.5 h-3.5 text-black shrink-0 fill-[#DCEFFD]" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                          )}

                          <span className={`truncate ${isDir ? 'font-black text-black' : 'font-mono text-black font-semibold'}`}>
                            {fileSearchQuery ? file.path : displayName}
                          </span>

                          {!fileSearchQuery && depth > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline truncate">
                              ({file.path})
                            </span>
                          )}
                        </div>

                        {file.size ? (
                          <span className="text-[10px] text-slate-600 font-mono shrink-0 ml-3">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        ) : isDir ? (
                          <span className="text-[10px] text-slate-400 font-mono uppercase shrink-0 ml-3">
                            dir
                          </span>
                        ) : null}
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="py-20 text-center brutal-card bg-white">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-black uppercase">Loading git tree from GitHub...</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: CONTRIBUTORS
            ======================================================== */}
        {activeTab === 'contributors' && (
          <div className="space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center">
                <Users className="w-4 h-4 mr-1.5" />
                Public Contributors & Maintainers
              </h2>
              <p className="text-xs text-slate-700 font-sans mt-0.5">
                Direct repository commit metrics. Mentors and Maintainers identified from merged pull requests and activity volume.
              </p>
            </div>

            {contributors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {contributors.map((c) => (
                  <a
                    key={c.id}
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-card bg-white p-4 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000000] transition-all flex items-center space-x-3.5 group cursor-pointer"
                  >
                    <img
                      src={c.avatar_url}
                      alt={c.login}
                      className="w-11 h-11 border-2 border-black shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-black group-hover:text-[#0284c7] transition-colors truncate">
                        {c.login}
                      </div>
                      <div className="text-[10px] text-slate-600 font-bold">
                        {c.contributions} public commits
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 border border-black uppercase ${
                            c.role === 'Maintainer'
                              ? 'bg-[#72C7E8] text-black'
                              : 'bg-[#DCEFFD] text-black'
                          }`}
                        >
                          {c.role}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center brutal-card bg-white">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-black uppercase">Fetching contributor profiles...</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 6: PULL REQUESTS
            ======================================================== */}
        {activeTab === 'pulls' && (
          <div id="pulls-list-container" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight flex items-center">
                  <GitPullRequest className="w-5 h-5 mr-2 text-black" />
                  Pull Requests & Code Reviews
                </h2>
                <p className="text-xs text-slate-700 font-sans mt-0.5">
                  Showing {totalPullsCount > 0 ? `${(currentPullsPage - 1) * pullsPerPage + 1}-${Math.min(currentPullsPage * pullsPerPage, totalPullsCount)} of ${totalPullsCount}` : pulls.length} pull requests • Page {currentPullsPage} of {totalPullsPages}
                </p>
              </div>

              {/* Status Filters & Per Page Toggle */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handlePullsFilterChange('all')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      pullsFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    All ({pullsFilter === 'all' && totalPullsCount > 0 ? totalPullsCount : pulls.length})
                  </button>
                  <button
                    onClick={() => handlePullsFilterChange('open')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      pullsFilter === 'open' ? 'bg-[#D5F5EF] text-black ring-2 ring-black font-black' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handlePullsFilterChange('merged')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      pullsFilter === 'merged' ? 'bg-[#E0E7FF] text-black ring-2 ring-black font-black' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    Merged
                  </button>
                  <button
                    onClick={() => handlePullsFilterChange('closed')}
                    className={`brutal-btn px-3 py-1.5 border-2 border-black ${
                      pullsFilter === 'closed' ? 'bg-slate-200 text-black ring-2 ring-black font-black' : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    Closed
                  </button>
                </div>

                {/* Per Page Toggle */}
                <div className="flex items-center space-x-1 pl-2 border-l-2 border-black/30">
                  <span className="text-[11px] text-slate-700 uppercase">Per page:</span>
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePullsPerPageChange(size)}
                      className={`px-2 py-1 border-2 border-black text-xs font-black transition-all ${
                        pullsPerPage === size ? 'bg-black text-[#72C7E8]' : 'bg-white text-black hover:bg-slate-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoadingPulls && (
              <div className="p-3 bg-[#DCEFFD] border-2 border-black brutal-shadow-sm flex items-center justify-center space-x-2 text-xs font-black">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Loading pull requests page {currentPullsPage} from GitHub API...</span>
              </div>
            )}

            {pulls.length > 0 ? (
              <div className="space-y-4">
                {pulls.map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-card bg-white p-4 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000000] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-black text-black">
                          #{pr.number}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 border border-black uppercase ${
                            pr.is_merged
                              ? 'bg-[#E0E7FF] text-black'
                              : pr.state === 'open'
                              ? 'bg-[#D5F5EF] text-black'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pr.is_merged ? 'merged' : pr.state}
                        </span>
                        <h4 className="text-sm font-black text-black group-hover:text-[#0284c7] transition-colors">
                          {pr.title}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-600 font-sans">
                        Opened on {new Date(pr.created_at).toLocaleDateString()}
                        {pr.merged_at && ` • Merged on ${new Date(pr.merged_at).toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="flex items-center space-x-2">
                        {pr.user_avatar && (
                          <img
                            src={pr.user_avatar}
                            alt={pr.user_login}
                            className="w-5 h-5 rounded-full border border-black"
                          />
                        )}
                        <span className="text-xs font-bold text-slate-700">@{pr.user_login}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black group-hover:text-[#0284c7] transition-colors" />
                    </div>
                  </a>
                ))}

                {/* Neo-brutalist Pagination Bar for Pull Requests */}
                {totalPullsPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-black">
                    <div className="text-xs font-bold text-black">
                      Showing Page <strong className="font-black">{currentPullsPage}</strong> of{' '}
                      <strong className="font-black">{totalPullsPages}</strong> ({totalPullsCount} total pull requests)
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs font-black">
                      <button
                        onClick={() => handlePullsPageChange(currentPullsPage - 1)}
                        disabled={currentPullsPage === 1 || isLoadingPulls}
                        className="brutal-btn px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {getPullsPageNumbers().map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`pulls-dots-${idx}`} className="px-2 py-1 text-black font-bold">
                                ...
                              </span>
                            );
                          }
                          const pageNum = p as number;
                          const isCurrent = pageNum === currentPullsPage;
                          return (
                            <button
                              key={`pulls-p-${pageNum}`}
                              onClick={() => handlePullsPageChange(pageNum)}
                              disabled={isLoadingPulls}
                              className={`brutal-btn min-w-[32px] h-[32px] px-2 text-xs font-black border-2 border-black brutal-shadow-sm transition-all ${
                                isCurrent
                                  ? 'bg-black text-[#72C7E8]'
                                  : 'bg-white text-black hover:bg-[#DCEFFD]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePullsPageChange(currentPullsPage + 1)}
                        disabled={currentPullsPage >= totalPullsPages || isLoadingPulls}
                        className="brutal-btn px-3 py-1.5 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Next Page"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !isLoadingPulls ? (
              <div className="py-16 text-center brutal-card bg-white p-8">
                <GitPullRequest className="w-8 h-8 text-black/50 mx-auto mb-2" />
                <h3 className="text-sm font-black text-black uppercase">No Pull Requests Found</h3>
                <p className="text-xs text-slate-600 font-sans mt-1">
                  No pull requests matching filter &quot;{pullsFilter}&quot;.
                </p>
              </div>
            ) : (
              <div className="py-20 text-center brutal-card bg-white">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-black uppercase">Fetching pull requests...</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 7: ISSUEPROOF WORKFLOW
            ======================================================== */}
        {activeTab === 'issue_proof' && (
          <div className="space-y-4">
            <IssueProofWorkflow owner={owner} repo={repo} />
          </div>
        )}
      </div>

      {/* Gemma 4 Analysis Modal */}
      {selectedIssue && (
        <IssueAnalysisModal
          issue={selectedIssue}
          owner={owner}
          repo={repo}
          onClose={() => setSelectedIssue(null)}
          onOpenIssueProof={() => {
            setActiveTab('issue_proof');
          }}
        />
      )}
    </div>
  );
}
