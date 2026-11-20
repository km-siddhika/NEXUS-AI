import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog, EmptyState } from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { GeneratedReport, ReportType } from '../types/nexus';
import { copyToClipboard, exportDocumentToPdf } from '../utils/exportPdf';

const REPORT_TYPES: ReportType[] = [
  'Problem Analysis Report',
  'Innovation Proposal',
  'Technical Project Report',
  'Project Roadmap',
  'Hackathon Presentation Outline',
  'Executive Summary',
];

export default function ReportsPage() {
  const { projects, reports, setReports, pushToast } = useWorkspace();
  const activeProjects = projects.filter((p) => !p.archived);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [reportType, setReportType] = useState<ReportType>('Innovation Proposal');
  const [customNotes, setCustomNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(reports[0] || null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GeneratedReport | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const project = activeProjects.find((p) => p.id === selectedProjectId);
    const projectTitle = project?.title || 'Custom Innovation Brief';
    setGenerating(true);
    try {
      const contextParts = [
        project?.problemAnalysis?.refinedStatement
          ? `Refined Problem: ${project.problemAnalysis.refinedStatement}`
          : '',
        project?.solutions?.find((s) => s.id === project.selectedSolutionId)
          ? `Selected Solution: ${project.solutions.find((s) => s.id === project.selectedSolutionId)?.name}`
          : '',
        customNotes,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await api.generateReport({
        projectId: project?.id,
        reportType,
        projectTitle,
        domain: project?.domain || 'Technology',
        description: project?.description || customNotes || projectTitle,
        contextSummary: contextParts,
      });

      setReports((prev) => [res.report, ...prev]);
      setActiveReport(res.report);
      pushToast('Report generated & saved', 'success', res.report.reportType);
    } catch (err) {
      pushToast('Generation failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!activeReport) return;
    const text = [
      `# ${activeReport.title}`,
      `${activeReport.reportType} · ${activeReport.projectTitle}`,
      '',
      ...activeReport.sections.flatMap((s) => [`## ${s.heading}`, s.content, '']),
    ].join('\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      pushToast('Copied report to clipboard', 'success');
    }
  };

  const handleExportPdf = () => {
    if (!activeReport) return;
    exportDocumentToPdf({
      title: activeReport.title,
      subtitle: `${activeReport.reportType} · ${activeReport.projectTitle}`,
      sections: activeReport.sections,
      filename: activeReport.title,
    });
    pushToast('PDF exported', 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteReport(deleteTarget.id);
      const remaining = reports.filter((r) => r.id !== deleteTarget.id);
      setReports(remaining);
      if (activeReport?.id === deleteTarget.id) {
        setActiveReport(remaining[0] || null);
      }
      setDeleteTarget(null);
      pushToast('Report deleted', 'info');
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#7955E8] mb-1">
          Make your work presentation-ready.
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
          Reports & Document Studio
        </h1>
      </div>

      {/* Document Generator Bar */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold mb-1.5">Document Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold mb-1.5">Source Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            >
              <option value="">Custom Brief (No linked project)</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">
            Additional Focus Notes (Optional)
          </label>
          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g., Emphasize low-cost hardware testing methodology for hackathon judges..."
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
          />
        </div>
      </form>

      {/* Saved Reports Library + Document Preview */}
      {reports.length === 0 && !activeReport ? (
        <EmptyState
          icon={FileText}
          title="No generated reports yet"
          description="Select a document type and project above to draft a structured proposal, presentation outline, or executive summary."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Saved Documents List */}
          <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 space-y-2">
            <h2 className="font-display font-bold text-sm px-2 py-1">
              Saved Documents ({reports.length})
            </h2>
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto">
              {reports.map((rep) => {
                const selected = activeReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    className={`rounded-xl p-3 border transition-colors flex items-start justify-between gap-2 ${
                      selected
                        ? 'bg-[#EEE8FF] dark:bg-[#251E42] border-[#7955E8]'
                        : 'bg-[#F8F8FC] dark:bg-[#1C1F2E] border-transparent hover:border-[#ECECF2]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveReport(rep)}
                      className="text-left min-w-0 flex-1"
                    >
                      <p className="text-xs font-bold truncate">{rep.title}</p>
                      <p className="text-[11px] text-[#777789] truncate mt-0.5">
                        {rep.reportType} · {new Date(rep.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rep)}
                      aria-label={`Delete ${rep.title}`}
                      title="Delete report"
                      className="p-1 text-[#777789] hover:text-[#DC2626] shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Preview Sheet */}
          <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-10">
            {activeReport ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#ECECF2] dark:border-[#23263A]">
                  <div>
                    <p className="text-xs font-semibold text-[#7955E8]">{activeReport.reportType}</p>
                    <h2 className="font-display font-bold text-xl sm:text-2xl mt-1">
                      {activeReport.title}
                    </h2>
                    <p className="text-xs text-[#777789] mt-1">
                      Project: {activeReport.projectTitle} · Generated{' '}
                      {new Date(activeReport.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {activeReport.sections.map((sec, idx) => (
                    <div key={idx}>
                      <h3 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
                        {sec.heading}
                      </h3>
                      <p className="text-sm text-[#424256] dark:text-[#C8C9DA] leading-relaxed whitespace-pre-line">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-[#ECECF2] dark:border-[#23263A] text-[11px] text-[#777789]">
                  © 2026 NEXUS AI · AI-generated estimates and draft prose should be independently reviewed.
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-[#777789]">
                Select a saved report on the left to preview or export.
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Report"
        message={`Delete "${deleteTarget?.title}" permanently?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
