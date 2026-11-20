import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Compass,
  Copy,
  FolderPlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import {
  PROJECT_DOMAINS,
  type ProblemAnalysis,
  type ProjectDomain,
} from '../types/nexus';
import { copyToClipboard } from '../utils/exportPdf';

export default function DiscoverPage() {
  const { setProjects, pushToast } = useWorkspace();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<ProjectDomain>('Environment');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (title.trim().length < 3 || description.trim().length < 15) {
      setError('Please provide a clear title and a detailed problem description (at least 15 characters).');
      return;
    }
    setLoading(true);
    try {
      const res = await api.discoverAnalyze({
        title,
        domain,
        targetAudience: targetAudience || 'Primary domain stakeholders',
        description,
        supportingInfo,
      });
      setAnalysis(res.analysis);
      pushToast('Problem analysis complete', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze problem';
      setError(msg);
      pushToast('Analysis error', 'error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsProject = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const res = await api.createProject({
        title: title.trim(),
        domain,
        status: 'Planning',
        description: description.trim(),
        targetAudience: targetAudience.trim() || 'Primary stakeholders',
        supportingInfo: supportingInfo.trim(),
        problemAnalysis: analysis,
        progress: 20,
      });
      setProjects((prev) => [res.project, ...prev]);
      pushToast('Saved to My Projects', 'success', res.project.title);
      navigate(`/app/projects/${res.project.id}`);
    } catch (err) {
      pushToast('Save failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAll = async () => {
    if (!analysis) return;
    const text = [
      `# ${title}`,
      `Domain: ${domain}`,
      '',
      `## Summary\n${analysis.summary}`,
      `## Refined Problem Statement\n${analysis.refinedStatement}`,
      `## Root Causes\n${analysis.rootCauses.map((i) => `- ${i}`).join('\n')}`,
      `## Affected Stakeholders\n${analysis.stakeholders.map((i) => `- ${i}`).join('\n')}`,
      `## Current Challenges\n${analysis.currentChallenges.map((i) => `- ${i}`).join('\n')}`,
      `## Possible Impact\n${analysis.possibleImpact.map((i) => `- ${i}`).join('\n')}`,
      `## Research Questions\n${analysis.researchQuestions.map((i) => `- ${i}`).join('\n')}`,
      `## Missing Information\n${analysis.missingInformation.map((i) => `- ${i}`).join('\n')}`,
      `## Opportunities for Innovation\n${analysis.opportunities.map((i) => `- ${i}`).join('\n')}`,
    ].join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      pushToast('Copied problem brief', 'success');
    }
  };

  const loadSamplePrompt = () => {
    setTitle('Cold-Chain Spoilage in Rural Vaccine Clinics');
    setDomain('Healthcare');
    setTargetAudience('Rural clinic nurses and regional immunization coordinators');
    setDescription(
      'Off-grid rural clinics face frequent solar refrigerator temperature excursions overnight, ruining vaccine batches before morning staff notice.'
    );
    setSupportingInfo('Clinics often have intermittent 2G cellular coverage and limited technical maintenance budgets.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#7955E8] mb-1">
            Start with a problem. Find the opportunity.
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            Every great innovation starts with a problem.
          </h1>
        </div>
        <button
          type="button"
          onClick={loadSamplePrompt}
          className="px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-xs font-semibold text-[#777789] hover:text-[#7955E8] transition-colors whitespace-nowrap shrink-0"
        >
          Load Example Problem
        </button>
      </div>

      {/* Problem Input Form */}
      <form
        onSubmit={handleAnalyze}
        className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-8 space-y-5"
      >
        {error && (
          <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] dark:border-[#7F1D1D] px-4 py-3 text-xs text-[#DC2626] dark:text-[#FCA5A5]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6">
            <label htmlFor="disc-title" className="block text-xs font-semibold mb-1.5">
              Problem Title
            </label>
            <input
              id="disc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Delayed Flood Warnings in Low-Lying Informal Settlements"
              required
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="disc-domain" className="block text-xs font-semibold mb-1.5">
              Domain
            </label>
            <select
              id="disc-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as ProjectDomain)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            >
              {PROJECT_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="disc-aud" className="block text-xs font-semibold mb-1.5">
              Target Audience
            </label>
            <input
              id="disc-aud"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Who experiences this?"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="disc-desc" className="block text-xs font-semibold mb-1.5">
            Detailed Problem Description
          </label>
          <textarea
            id="disc-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happens today, why existing workarounds fall short, and what constraints matter..."
            required
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label htmlFor="disc-info" className="block text-xs font-semibold mb-1.5">
            Optional Supporting Information (Observations, constraints, budget, geography)
          </label>
          <input
            id="disc-info"
            type="text"
            value={supportingInfo}
            onChange={(e) => setSupportingInfo(e.target.value)}
            placeholder="e.g., Must work offline, target BOM under $40, 6-week hackathon build window"
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-[#777789] dark:text-[#9C9DB2]">
            AI-generated insights should be reviewed and validated with real domain stakeholders.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze with Gemini</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Structured 9-Section Analysis Output */}
      {analysis && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#7955E8]" />
              <h2 className="font-display font-bold text-xl text-[#171725] dark:text-[#F4F4FA]">
                Structured Problem Analysis
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-xs font-semibold hover:border-[#7955E8] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Analysis'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAsProject}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save as New Project'}</span>
              </button>
            </div>
          </div>

          {/* Editable Summary & Refined Statement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
              <label className="block text-xs font-semibold text-[#7955E8] mb-2">
                01. Problem Summary (Editable)
              </label>
              <textarea
                rows={4}
                value={analysis.summary}
                onChange={(e) => setAnalysis({ ...analysis, summary: e.target.value })}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3 text-sm leading-relaxed"
              />
            </div>
            <div className="rounded-2xl bg-[#EEE8FF]/60 dark:bg-[#231D3A] border border-[#7955E8]/25 p-5">
              <label className="block text-xs font-semibold text-[#7955E8] dark:text-[#C5B3FF] mb-2">
                02. Refined Problem Statement (Editable)
              </label>
              <textarea
                rows={4}
                value={analysis.refinedStatement}
                onChange={(e) => setAnalysis({ ...analysis, refinedStatement: e.target.value })}
                className="w-full rounded-xl border border-[#7955E8]/20 bg-white dark:bg-[#151722] p-3 text-sm font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Remaining 7 Structured Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { num: '03', label: 'Root Causes', items: analysis.rootCauses },
              { num: '04', label: 'Affected Stakeholders', items: analysis.stakeholders },
              { num: '05', label: 'Current Challenges', items: analysis.currentChallenges },
              { num: '06', label: 'Possible Impact', items: analysis.possibleImpact },
              { num: '07', label: 'Research Questions', items: analysis.researchQuestions },
              { num: '08', label: 'Missing Information', items: analysis.missingInformation },
            ].map((sec) => (
              <div
                key={sec.num}
                className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                    {sec.num}. {sec.label}
                  </h3>
                  <span className="font-mono text-xs text-[#777789]">{sec.items.length}</span>
                </div>
                <ul className="space-y-2 text-xs text-[#424256] dark:text-[#C8C9DA] leading-relaxed">
                  {sec.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#7955E8] font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="md:col-span-2 lg:col-span-3 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <h3 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-3">
                09. Opportunities for Innovation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.opportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-3.5 text-xs text-[#171725] dark:text-[#F4F4FA] leading-relaxed"
                  >
                    {opp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
