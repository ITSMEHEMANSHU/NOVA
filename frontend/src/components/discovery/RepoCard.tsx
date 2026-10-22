'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RepoSearchResult } from '@/types';
import { Star, AlertCircle, ExternalLink, CheckCircle2, Award, ArrowRight, ShieldAlert, GitFork } from 'lucide-react';
import { prepareRepository } from '@/lib/api';

interface RepoCardProps {
  repo: RepoSearchResult;
}

export default function RepoCard({ repo }: RepoCardProps) {
  const router = useRouter();
  const score = repo.match_explanation?.score || 50;

  const handleOpenWorkspace = () => {
    prepareRepository(repo.owner, repo.name).catch(() => {});
    router.push(`/repo/${repo.owner}/${repo.name}`);
  };

  return (
    <div className="brutal-card bg-white p-6 sm:p-7 flex flex-col justify-between group font-mono">
      <div>
        {/* Card Header: Owner / Name & Match Score */}
        <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b-2 border-black/15">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1">
              <span>{repo.owner} /</span>
              {repo.match_explanation?.is_gsoc_affiliated && (
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-[#D5F5EF] text-black border border-black brutal-shadow-sm">
                  GSoC
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-black group-hover:text-[#0284c7] transition-colors truncate uppercase">
              {repo.name}
            </h3>
          </div>

          {/* Match Score Badge */}
          <div
            className="px-2.5 py-1 border-2 border-black brutal-shadow-sm font-black text-xs shrink-0 bg-[#D5F5EF] text-black"
            title="Explainable suitability score based on your profile"
          >
            {score}% FIT
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm font-medium font-sans text-slate-700 line-clamp-2 mb-4 leading-relaxed">
          {repo.description || 'No description provided by repository maintainers.'}
        </p>

        {/* Explainable Fit Reasons Box */}
        {repo.match_explanation?.reasons_for_fit && repo.match_explanation.reasons_for_fit.length > 0 && (
          <div className="mb-4 bg-[#DCEFFD] border-2 border-black p-3.5 brutal-shadow-sm text-xs">
            <div className="text-[10px] font-black text-black uppercase tracking-wider mb-1.5 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-black mr-1.5" />
              Evidence-based fit
            </div>
            <ul className="space-y-1 font-sans">
              {repo.match_explanation.reasons_for_fit.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs font-medium text-black flex items-start leading-snug">
                  <span className="font-bold mr-1.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Potential Challenges / Strictness Warning */}
        {repo.match_explanation?.potential_challenges && repo.match_explanation.potential_challenges.length > 0 && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border-2 border-black text-xs text-black flex items-start space-x-2 brutal-shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span className="line-clamp-1 font-sans font-medium">{repo.match_explanation.potential_challenges[0]}</span>
          </div>
        )}

        {/* Topics Chips */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {repo.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-black border border-black"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta & Tactile CTAs */}
      <div className="pt-4 border-t-2 border-black/20 flex items-center justify-between mt-auto">
        {/* GitHub Stats */}
        <div className="flex items-center space-x-3 text-xs font-bold text-black">
          <div className="flex items-center space-x-1" title="Stars">
            <Star className="w-3.5 h-3.5 fill-black" />
            <span>{repo.stars_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1" title="Open Issues">
            <AlertCircle className="w-3.5 h-3.5 text-black" />
            <span>{repo.open_issues_count}</span>
          </div>
          {repo.primary_language && (
            <span className="px-2 py-0.5 bg-[#D5F5EF] border border-black text-[10px] font-black uppercase">
              {repo.primary_language}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn p-2 bg-white border-2 border-black brutal-shadow-sm hover:bg-[#D5F5EF] text-black transition-all cursor-pointer"
            title="Open on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleOpenWorkspace}
            className="brutal-btn flex items-center space-x-1 px-4 py-2 bg-[#72C7E8] hover:bg-black hover:text-[#72C7E8] text-black text-xs font-black uppercase border-2 border-black brutal-shadow-sm"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
