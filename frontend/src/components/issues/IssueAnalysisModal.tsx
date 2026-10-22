'use client';

import React, { useState, useEffect } from 'react';
import { IssueItem, IssueAnalysisResponse } from '@/types';
import { analyzeIssue } from '@/lib/api';
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
