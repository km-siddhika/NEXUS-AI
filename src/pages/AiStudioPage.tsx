import React, { useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  Cpu,
  GitBranch,
  Layers,
  Loader2,
  MessageSquare,
  Presentation,
  RefreshCw,
  Save,
  Scale,
  SearchCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import { PROJECT_DOMAINS, type ProjectDomain, type StudioToolId } from '../types/nexus';
import { copyToClipboard } from '../utils/exportPdf';

interface StudioToolMeta {
  id: StudioToolId;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}

const STUDIO_TOOLS: StudioToolMeta[] = [
  {
    id: 'problem_analyzer',
    name: 'Problem Analyzer',
    subtitle: 'Clarify core tension, stakeholder pain, and testable hypotheses.',
    icon: Compass,
    placeholder: 'Describe the problem or observation you want to dissect...',
  },
  {
    id: 'solution_generator',
    name: 'AI Solution Generator',
    subtitle: 'Brainstorm contrasting software, hardware, or workflow concepts.',
    icon: Sparkles,
    placeholder: 'State the goal, user environment, and constraints...',
  },
  {
    id: 'root_cause',
    name: 'Root Cause Analyzer',
    subtitle: 'Run a 5-Whys and systems-level breakdown of underlying drivers.',
    icon: SearchCheck,
    placeholder: 'Describe the recurring failure or symptom you keep seeing...',
  },
  {
    id: 'feasibility',
    name: 'Feasibility Evaluator',
    subtitle: 'Assess technical, operational, budget, and adoption estimates.',
    icon: Scale,
    placeholder: 'Describe your proposed solution, team size, and timeline...',
  },
  {
    id: 'roadmap_generator',
    name: 'Project Roadmap Generator',
    subtitle: 'Sequence MVP phases, verification tests, and deliverables.',
    icon: GitBranch,
    placeholder: 'Specify target MVP scope and available build weeks...',
  },
  {
    id: 'tech_stack',
    name: 'Technology Stack Recommender',
    subtitle: 'Select pragmatic frameworks, sensors, models, and storage.',
    icon: Cpu,
    placeholder: 'Describe latency, offline needs, scale, and team familiarity...',
  },
  {
    id: 'pitch_assistant',
    name: 'Hackathon Pitch Assistant',
    subtitle: 'Craft a crisp judge-ready demo narrative and slide flow.',
    icon: Presentation,
    placeholder: 'Describe your prototype, target judges, and demo length...',
  },
  {
    id: 'project_chat',
    name: 'Project AI Chat Assistant',
    subtitle: 'Multi-turn engineering and research dialogue grounded in your project.',
    icon: MessageSquare,
    placeholder: 'Ask a technical, architectural, or research question...',
  },
];

export default function AiStudioPage() {
  const { projects, setProjects, setReports, pushToast } = useWorkspace();
  const activeProjects = projects.filter((p) => !p.archived);

  const [selectedTool, setSelectedTool] = useState<StudioToolId>('problem_analyzer');
  const [linkedProjectId, setLinkedProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [domain, setDomain] = useState<ProjectDomain>(activeProjects[0]?.domain || 'Technology');
  const [promptInput, setPromptInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const [result, setResult] = useState<{
    headline: string;
    summary: string;
    sections: Array<{ title: string; items: string[]; note?: string }>;
    markdownText: string;
  } | null>(null);

  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);

  const activeTool = STUDIO_TOOLS.find((t) => t.id === selectedTool)!;
  const linkedProject = activeProjects.find((p) => p.id === linkedProjectId);

  const handleProjectLinkChange = (pid: string) => {
    setLinkedProjectId(pid);
    const p = activeProjects.find((item) => item.id === pid);
    if (p) {
      setDomain(p.domain);
      setContextInput(p.description);
    }
  };

  const runTool = async (overridePrompt?: string) => {
    const query = (overridePrompt ?? promptInput).trim();
    if (!query) {
      setError('Please enter a prompt or question first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.runStudioTool({
        toolId: selectedTool,
        promptInput: query,
        context: contextInput || linkedProject?.description,
        projectTitle: linkedProject?.title,
        domain: linkedProject?.domain || domain,
        history: selectedTool === 'project_chat' ? chatHistory : undefined,
      });

      if (selectedTool === 'project_chat') {
        setChatHistory((prev) => [
          ...prev,
          { role: 'user', text: query },
          { role: 'model', text: res.result.summary },
        ]);
        setPromptInput('');
      } else {
        setResult(res.result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      setError(msg);
      pushToast('AI Studio error', 'error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const ok = await copyToClipboard(result.markdownText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      pushToast('Copied output to clipboard', 'success');
    }
  };

  const handleSaveOutput = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const savedRep = await api.saveReport({
        projectId: linkedProject?.id,
        projectTitle: linkedProject?.title || 'AI Studio Note',
        reportType: 'Innovation Proposal',
        title: `${activeTool.name} — ${result.headline}`,
        sections: [
          { heading: 'Summary', content: result.summary },
          ...result.sections.map((s) => ({
            heading: s.title,
            content: s.items.map((i) => `• ${i}`).join('\n'),
          })),
        ],
      });
      setReports((prev) => [savedRep.report, ...prev]);

      if (linkedProject) {
        const notePatch: Record<string, string> = {};
        if (selectedTool === 'feasibility') notePatch.feasibility = result.markdownText;
        if (selectedTool === 'tech_stack') notePatch.techStack = result.markdownText;
        if (selectedTool === 'root_cause') notePatch.rootCauseDeepDive = result.markdownText;
        if (Object.keys(notePatch).length > 0) {
          const upd = await api.updateProject(linkedProject.id, { aiNotes: notePatch });
          setProjects((prev) => prev.map((p) => (p.id === upd.project.id ? upd.project : p)));
        }
      }

      pushToast('Saved to Reports & Project', 'success');
    } catch (err) {
      pushToast('Save failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#7955E8] mb-1">
          Think bigger. Let intelligence do the groundwork.
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
          Your innovation copilot.
        </h1>
      </div>

      {/* 8 Tool Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STUDIO_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setSelectedTool(tool.id);
                setError('');
              }}
              className={`text-left rounded-2xl p-4 border transition-colors ${
                active
                  ? 'bg-[#EEE8FF] dark:bg-[#251E42] border-[#7955E8] text-[#171725] dark:text-[#F4F4FA]'
                  : 'bg-white dark:bg-[#151722] border-[#ECECF2] dark:border-[#23263A] hover:border-[#7955E8]/40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                  active
                    ? 'bg-[#7955E8] text-white'
                    : 'bg-[#F8F8FC] dark:bg-[#1C1F2E] text-[#7955E8]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-display font-bold text-sm">{tool.name}</p>
              <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1 line-clamp-2">
                {tool.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Tool Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form & Context */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#ECECF2] dark:border-[#23263A]">
            <Layers className="w-4 h-4 text-[#7955E8]" />
            <h2 className="font-display font-bold text-base">{activeTool.name}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Link Project Context</label>
              <select
                value={linkedProjectId}
                onChange={(e) => handleProjectLinkChange(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
              >
                <option value="">Standalone Prompt</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as ProjectDomain)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
              >
                {PROJECT_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Background Context (Optional)</label>
            <textarea
              rows={2}
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="Constraints, hardware limits, target users..."
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {selectedTool === 'project_chat' ? 'Ask Project Copilot' : 'Input Prompt'}
            </label>
            <textarea
              rows={4}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={activeTool.placeholder}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] px-3 py-2 text-xs text-[#DC2626]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => runTool()}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating with Gemini...</span>
              </>
            ) : selectedTool === 'project_chat' ? (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Structured Output or Multi-turn Chat */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 min-h-[380px] flex flex-col">
          {selectedTool === 'project_chat' ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#ECECF2] dark:border-[#23263A]">
                  <h3 className="font-display font-bold text-base">Project AI Chat Transcript</h3>
                  {chatHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setChatHistory([])}
                      className="text-xs text-[#777789] hover:text-[#DC2626]"
                    >
                      Clear Chat
                    </button>
                  )}
                </div>

                {chatHistory.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#777789] max-w-sm mx-auto">
                    Ask architecture questions, debug implementation tradeoffs, or brainstorm field
                    testing protocols with your project context attached.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {chatHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                          m.role === 'user'
                            ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#171725] dark:text-[#F4F4FA] ml-8'
                            : 'bg-[#F8F8FC] dark:bg-[#1C1F2E] text-[#171725] dark:text-[#F4F4FA] mr-8 border border-[#ECECF2] dark:border-[#2A2E45]'
                        }`}
                      >
                        <div className="font-semibold mb-1 text-[11px] text-[#7955E8]">
                          {m.role === 'user' ? 'You' : 'NEXUS Copilot'}
                        </div>
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-7 h-7 text-[#7955E8] animate-spin mb-3" />
              <p className="text-sm font-semibold">Synthesizing structured guidance...</p>
              <p className="text-xs text-[#777789] mt-1">
                Powered by Gemini on the NEXUS AI backend
              </p>
            </div>
          ) : !result ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
              <div className="w-11 h-11 rounded-xl bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="font-display font-bold text-base">Ready when you are</p>
              <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1.5 leading-relaxed">
                Select a project context on the left, enter your prompt, and generate structured,
                copyable, savable output.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ECECF2] dark:border-[#23263A]">
                <div>
                  <p className="text-[11px] font-semibold text-[#7955E8]">
                    {activeTool.name} · AI Estimate
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#171725] dark:text-[#F4F4FA]">
                    {result.headline}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy result"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOutput}
                    disabled={saving}
                    title="Save to Reports"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => runTool()}
                    title="Regenerate"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#424256] dark:text-[#C8C9DA] leading-relaxed">
                {result.summary}
              </p>

              <div className="space-y-4">
                {result.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4"
                  >
                    <h4 className="font-display font-bold text-sm mb-2">{sec.title}</h4>
                    <ul className="space-y-1.5 text-xs text-[#424256] dark:text-[#C8C9DA]">
                      {sec.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#7955E8] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {sec.note && (
                      <p className="mt-2 pt-2 border-t border-[#ECECF2] dark:border-[#2A2E45] text-[11px] text-[#777789]">
                        Note: {sec.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
