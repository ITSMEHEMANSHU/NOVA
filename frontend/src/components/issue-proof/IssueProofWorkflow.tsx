'use client';

import React, { useState } from 'react';
import { auditBugReport, generateBugReport } from '@/lib/api';
import { IssueProofAuditResult, GeneratedReport } from '@/types';
import {
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  FileCheck,
  Sparkles,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface IssueProofWorkflowProps {
  owner: string;
  repo: string;
  initialTitle?: string;
  initialDescription?: string;
}

export default function IssueProofWorkflow({
  owner,
  repo,
  initialTitle = '',
  initialDescription = '',
}: IssueProofWorkflowProps) {
  // Form fields (initialized empty with placeholders instead of mock data)
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [environment, setEnvironment] = useState('');
  const [logs, setLogs] = useState('');
  const [reproducibility, setReproducibility] = useState('Always (100%)');

  // Audit state
  const [auditResult, setAuditResult] = useState<IssueProofAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Generated report state
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditBugReport({
        owner,
        repo,
        title,
        description,
        steps_to_reproduce: steps,
        expected_behavior: expected,
        actual_behavior: actual,
        environment,
        error_logs: logs,
      });
      setAuditResult(res);
    } catch (err: any) {
      alert(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateBugReport({
        owner,
        repo,
        title,
        description,
        environment,
        steps_to_reproduce: steps,
        expected_behavior: expected,
        actual_behavior: actual,
        error_logs: logs,
        reproducibility,
      });
      setReport(res);
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (report?.markdown_content) {
      navigator.clipboard.writeText(report.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="spark-panel-lg bg-white p-6 sm:p-8 space-y-6 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-black px-2 py-0.5 bg-[#D5F5EF] text-black border border-black mb-1 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>IssueProof Evidence Auditor</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-black uppercase">
            Transform Rough Observations into Evidence-Backed GitHub Reports
          </h3>
        </div>

        {auditResult && (
          <div className="flex items-center space-x-3 bg-[#DCEFFD] px-3.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-black">Completeness Score</div>
              <div className="text-lg font-black text-black">
                {auditResult.completeness_score}/100
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
              Issue Title / Summary
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unhandled exception when passing invalid UUID in path parameter"
              className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
              Rough Bug Observation
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, context, and why you believe this is a bug..."
              className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
              Exact Steps to Reproduce
            </label>
            <textarea
              rows={3}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Clone repository and install dependencies&#10;2. Run server command&#10;3. Send curl request to /items/bad-uuid"
              className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
                Expected Behavior
              </label>
              <textarea
                rows={2}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="e.g. Server should return HTTP 422 Unprocessable Entity with validation details"
                className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
                Actual Behavior
              </label>
              <textarea
                rows={2}
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="e.g. Server returns HTTP 500 Internal Server Error with unhandled ValueError"
                className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
                Environment & Versions
              </label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="OS, runtime, package version"
                className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
                Reproducibility
              </label>
              <select
                value={reproducibility}
                onChange={(e) => setReproducibility(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
              >
                <option value="Always (100%)">Always (100%)</option>
                <option value="Intermittent (~50%)">Intermittent (~50%)</option>
                <option value="Rarely (<10%)">Rarely (&lt;10%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-black mb-1">
              Error Traceback / Terminal Logs
            </label>
            <textarea
              rows={2}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Paste stack traces or terminal output..."
              className="w-full px-3 py-2 text-xs bg-white border-2 border-black rounded-none text-black font-bold shadow-[2px_2px_0px_#000000] focus:outline-none focus:bg-[#D5F5EF]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleAudit}
          disabled={isAuditing}
          className="spark-btn flex items-center space-x-2 px-5 py-2.5 bg-[#D5F5EF] hover:bg-[#bcf2e7] text-black text-xs font-black uppercase tracking-wider"
        >
          {isAuditing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-black" />
          )}
          <span>Audit Missing Evidence</span>
        </button>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="spark-btn flex items-center space-x-2 px-5 py-2.5 bg-[#72C7E8] hover:bg-[#5bb8dc] text-black text-xs font-black uppercase tracking-wider"
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileCheck className="w-3.5 h-3.5 text-black" />
          )}
          <span>Generate GitHub Markdown Report</span>
        </button>
      </div>

      {/* Audit Feedback & Targeted Questions */}
      {auditResult && (
        <div className="p-4 bg-[#DCEFFD] border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-black flex items-center uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-black mr-1.5" />
              Audit Results & Feedback
            </h4>
            <span className="text-xs font-bold text-black">{auditResult.feedback}</span>
          </div>

          {auditResult.clarification_questions.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-black">
                Targeted Questions to Strengthen This Report:
              </span>
              {auditResult.clarification_questions.map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-xs"
                >
                  <div className="font-black text-black mb-0.5">{q.question}</div>
                  <div className="text-slate-600 font-bold text-[11px] mb-1">{q.why_important}</div>
                  {q.example_answer && (
                    <div className="text-[11px] font-mono font-bold text-slate-800">
                      Example: {q.example_answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generated Report Preview */}
      {report && (
        <div className="p-5 bg-[#DCEFFD] border-2 border-black shadow-[4px_4px_0px_#000000] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black text-black">
                GitHub-Ready Markdown Preview
              </span>
              <h4 className="text-xs sm:text-sm font-black text-black">{report.title}</h4>
            </div>

            <button
              onClick={copyToClipboard}
              className="spark-btn flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-[#D5F5EF] text-black text-xs font-black uppercase"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-black" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-xs font-mono font-medium text-black whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {report.markdown_content}
          </pre>

          {report.unverified_elements_flagged.length > 0 && (
            <div className="text-[11px] text-amber-900 font-bold">
              ⚠️ Grounding audit: {report.unverified_elements_flagged.join(' ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
