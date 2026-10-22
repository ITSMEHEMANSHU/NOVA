'use client';

import React, { useState, useEffect } from 'react';
import { IssueItem, IssueAnalysisResponse, IssueActivityDetails } from '@/types';
import { analyzeIssue, getIssueActivity } from '@/lib/api';
import {
  Sparkles,
  CheckCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Code2,
  ListOrdered,
  Users,
  GitPullRequest,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface IssueAnalysisModalProps {
  issue: IssueItem;
  owner: string;
  repo: string;
  onClose: () => void;
  onOpenIssueProof?: (issue: IssueItem) => void;
}

export default function IssueAnalysisModal({
  issue,
  owner,
  repo,
  onClose,
  onOpenIssueProof,
}: IssueAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<IssueAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live contributor activity state
  const [activity, setActivity] = useState<IssueActivityDetails | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    analyzeIssue(owner, repo, issue.number, issue.title, issue.body || '', 'beginner')
      .then((data) => {
        if (mounted) {
          setAnalysis(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Analysis failed');
          setLoading(false);
        }
      });

    // Fetch live issue worker / assignee / PR activity
    setActivityLoading(true);
    getIssueActivity(owner, repo, issue.number)
      .then((act) => {
        if (mounted) {
          setActivity(act);
          setActivityLoading(false);
        }
      })
      .catch((e) => {
        console.warn('Failed to load issue activity:', e);
        if (mounted) {
          setActivityLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [owner, repo, issue.number, issue.title, issue.body]);

  return (
    <div className="fixed inset-0 z-50 bg-[#17212B]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black rounded-none w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_#000000] overflow-hidden font-mono">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-black bg-[#DCEFFD] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-black text-black mb-1 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Gemma 4 Guided Contribution Plan</span>
              <span>•</span>
              <span>Issue #{issue.number}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-black line-clamp-1">{issue.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-white border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#D5F5EF] active:translate-x-[1px] active:translate-y-[1px] text-black font-black text-xs flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          {/* ========================================================
              LIVE CONTRIBUTOR & WORKER ACTIVITY STATUS
              ======================================================== */}
          {activityLoading ? (
            <div className="p-3.5 bg-slate-100 border-2 border-black flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Checking if existing contributors are working on issue #{issue.number}...</span>
              </div>
            </div>
          ) : activity ? (
            <div
              className={`border-2 border-black p-4 brutal-shadow-sm font-mono ${
                activity.has_active_workers
                  ? 'bg-[#FEF3C7] text-black'
                  : 'bg-[#D5F5EF] text-black'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black/20 pb-2.5 mb-2.5">
                <div className="flex items-center space-x-2">
                  {activity.has_active_workers ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-[#FEF3C7] text-xs font-black uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" />
                      <span>{activity.status_badge.replace(/_/g, ' ')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-[#D5F5EF] text-xs font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>UNASSIGNED • AVAILABLE TO WORK</span>
                    </span>
                  )}
                  <span className="text-xs font-black text-black hidden sm:inline">
                    // Contributor Activity Status
                  </span>
                </div>

                <a
                  href={`https://github.com/${owner}/${repo}/issues/${issue.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline shrink-0"
                >
                  <span>View Issue #{issue.number} on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs sm:text-sm font-sans font-semibold text-slate-900 leading-relaxed mb-3">
                {activity.status_summary}
              </p>

              {/* Active assignees details */}
              {activity.assignees.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    Assigned Contributor{activity.assignees.length > 1 ? 's' : ''}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activity.assignees.map((a) => (
                      <a
                        key={a.login}
                        href={a.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border-2 border-black px-2.5 py-1 text-xs font-black hover:bg-black hover:text-[#72C7E8] transition-colors"
                      >
                        {a.avatar_url && (
                          <img src={a.avatar_url} alt={a.login} className="w-4 h-4 rounded-full border border-black" />
                        )}
                        <span>@{a.login}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Pull Requests */}
              {activity.linked_prs.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>Linked Pull Request{activity.linked_prs.length > 1 ? 's' : ''} Addressing This Issue:</span>
                  </div>
                  <div className="space-y-1.5">
                    {activity.linked_prs.map((pr) => (
                      <a
                        key={pr.number}
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-white border-2 border-black hover:bg-[#DCEFFD] text-xs font-bold transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 border border-black uppercase ${
                              pr.state === 'open'
                                ? 'bg-[#D5F5EF] text-emerald-900'
                                : pr.state === 'merged'
                                ? 'bg-purple-100 text-purple-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {pr.state}
                          </span>
                          <span className="font-mono font-black text-black">PR #{pr.number}</span>
                          <span className="truncate font-sans text-slate-800 group-hover:text-black">
                            {pr.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2 text-[11px] text-slate-600 font-sans">
                          <span>by @{pr.author_login}</span>
                          <ExternalLink className="w-3 h-3 text-black" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion Intent / Claims */}
              {activity.recent_claims.length > 0 && (
                <div className="mb-2 space-y-1.5">
                  <div className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contributor Intent in Discussion:</span>
                  </div>
                  <div className="space-y-1">
                    {activity.recent_claims.map((claim, idx) => (
                      <div key={idx} className="p-2 bg-white border border-black text-xs font-sans">
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <span>@{claim.author_login}</span>
                          {claim.html_url && (
                            <a href={claim.html_url} target="_blank" rel="noopener noreferrer" className="text-[11px] hover:underline flex items-center gap-1">
                              View comment <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-slate-700 italic line-clamp-2">
                          &quot;{claim.comment_body}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guidance footer */}
              {activity.has_active_workers ? (
                <div className="mt-2.5 pt-2 border-t border-black/20 text-[11px] font-sans font-bold text-amber-950 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>
                    Another contributor is already working on or assigned to this issue. To avoid duplicate effort, coordinate on GitHub before writing code.
                  </span>
                </div>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-black/20 text-[11px] font-sans font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>🚀</span>
                  <span>
                    No one is working on this issue right now. You can comment on GitHub to claim it and follow the step-by-step plan below!
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black uppercase">
                Gemma 4 is synthesizing repository evidence and building your preparation plan...
              </p>
              <p className="text-xs text-slate-700 font-sans font-medium">
                Grounding against retrieved README, AST imports, and open maintainer discussion.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-black text-xs text-black flex items-start space-x-2 shadow-[2px_2px_0px_#000000]">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-black mb-0.5">Unable to generate AI analysis</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {analysis && (
            <>
              {/* Plain Language Summary */}
              <div className="bg-[#D5F5EF] border-2 border-black p-4 shadow-[3px_3px_0px_#000000]">
                <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1.5 flex items-center">
                  <FileText className="w-3.5 h-3.5 text-black mr-1.5" />
                  Plain Language Problem Explanation
                </h3>
                <p className="text-xs sm:text-sm text-black font-sans font-medium leading-relaxed">
                  {analysis.plain_language_explanation}
                </p>
                <div className="mt-2.5 pt-2.5 border-t-2 border-black/20 text-xs font-sans text-slate-800">
                  <strong className="font-black text-black">Why it matters:</strong>{' '}
                  {analysis.why_it_matters}
                </div>
              </div>

              {/* Likely Relevant Code Files */}
              {analysis.likely_relevant_files && analysis.likely_relevant_files.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2.5 flex items-center">
                    <Code2 className="w-3.5 h-3.5 text-black mr-1.5" />
                    Likely Affected Modules & Files (Grounded Evidence)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.likely_relevant_files.map((file, idx) => (
                      <a
                        key={idx}
                        href={`https://github.com/${owner}/${repo}/blob/main/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] hover:bg-[#DCEFFD] text-xs font-bold text-black transition-all group"
                      >
                        <span className="truncate">{file}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-black shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisites Checklist */}
              {analysis.prerequisites && analysis.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2.5 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-black mr-1.5" />
                    Prerequisite Knowledge Checklist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysis.prerequisites.map((prereq, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]"
                      >
                        <div className="text-xs font-black text-black mb-1">{prereq.concept}</div>
                        <div className="text-xs text-slate-700 font-sans font-medium leading-snug">
                          {prereq.why_needed}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Investigation Plan */}
              {analysis.investigation_plan && analysis.investigation_plan.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2.5 flex items-center">
                    <ListOrdered className="w-3.5 h-3.5 text-black mr-1.5" />
                    Suggested Sequence of Investigation
                  </h3>
                  <div className="space-y-2.5">
                    {analysis.investigation_plan.map((step) => (
                      <div
                        key={step.step_number}
                        className="flex items-start space-x-3 p-3.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]"
                      >
                        <div className="w-6 h-6 rounded-none bg-[#72C7E8] border-2 border-black shadow-[1.5px_1.5px_0px_#000000] text-black text-xs font-black flex items-center justify-center shrink-0">
                          {step.step_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-black mb-0.5">{step.title}</h4>
                          <p className="text-xs text-slate-700 font-sans font-medium leading-relaxed mb-1.5">
                            {step.description}
                          </p>
                          {step.suggested_commands_or_tests &&
                            step.suggested_commands_or_tests.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {step.suggested_commands_or_tests.map((cmd, i) => (
                                  <code
                                    key={i}
                                    className="text-[10px] font-bold px-1.5 py-0.2 bg-[#D5F5EF] text-black border border-black"
                                  >
                                    $ {cmd}
                                  </code>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions before modifying code */}
              {analysis.questions_before_modifying_code &&
                analysis.questions_before_modifying_code.length > 0 && (
                  <div className="p-3.5 bg-amber-50 border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <h3 className="text-xs font-black text-black uppercase tracking-wider mb-1.5 flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-800 mr-1.5" />
                      Questions to verify before writing code
                    </h3>
                    <ul className="space-y-1 font-sans">
                      {analysis.questions_before_modifying_code.map((q, idx) => (
                        <li key={idx} className="text-xs font-medium text-slate-800 flex items-start">
                          <span className="text-black font-bold mr-1.5">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Uncertainties & Grounding */}
              {analysis.uncertainties_and_unknowns && (
                <div className="text-[11px] font-bold text-slate-600 border-t-2 border-black/20 pt-2.5">
                  <span className="text-black font-black">Model:</span> {analysis.model_used} •{' '}
                  <span className="text-black font-black">Grounding:</span> All inferred details are labeled as hypotheses.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t-2 border-black bg-[#F8FCFE] flex items-center justify-between">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-black transition-colors"
          >
            <span>Open Original GitHub Issue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center space-x-2">
            {onOpenIssueProof && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIssueProof(issue);
                }}
                className="spark-btn flex items-center space-x-1 px-3.5 py-1.5 bg-[#72C7E8] hover:bg-[#5bb8dc] text-black text-xs font-black uppercase"
              >
                <span>Prepare with IssueProof</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="spark-btn px-3.5 py-1.5 bg-white hover:bg-slate-100 text-black text-xs font-black uppercase"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
