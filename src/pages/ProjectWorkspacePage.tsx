import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Edit3,
  GitBranch,
  Layers,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  Presentation,
  Save,
  Scale,
  Send,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { ProjectCoverIllustration } from '../components/ProjectArtwork';
import { ConfirmDialog, Modal, ProjectFormModal } from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type {
  PitchDeckData,
  ProjectTask,
  TaskPriority,
  TaskStatus,
} from '../types/nexus';
import { copyToClipboard, exportDocumentToPdf } from '../utils/exportPdf';

type TabId =
  | 'overview'
  | 'brief'
  | 'causes'
  | 'stakeholders'
  | 'solutions'
  | 'comparison'
  | 'roadmap'
  | 'tasks'
  | 'pitch'
  | 'assistant';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'brief', label: 'Problem Brief' },
  { id: 'causes', label: 'Root Causes' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'pitch', label: 'Pitch Builder' },
  { id: 'assistant', label: 'Project Assistant' },
];

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    projects,
    tasks,
    comments,
    setProjects,
    setTasks,
    setComments,
    pushToast,
  } = useWorkspace();

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === id), [tasks, id]);
  const projectComments = useMemo(() => comments.filter((c) => c.projectId === id), [comments, id]);

  const initialTab = (searchParams.get('tab') as TabId) || 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'overview'
  );

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Modals & AI states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Task Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeleteTarget, setTaskDeleteTarget] = useState<ProjectTask | null>(null);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  // Pitch Builder local state
  const [pitchDraft, setPitchDraft] = useState<PitchDeckData | null>(null);

  // Assistant chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);

  if (!project) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-10 text-center max-w-lg mx-auto my-12">
        <h2 className="font-display font-bold text-xl">Project not found</h2>
        <p className="text-sm text-[#777789] mt-2">
          This project may have been deleted or belongs to another workspace.
        </p>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Projects</span>
        </Link>
      </div>
    );
  }

  const selectedSolution = project.solutions?.find((s) => s.id === project.selectedSolutionId);
  const activePitch: PitchDeckData = pitchDraft ||
    project.pitch || {
      projectTitle: project.title,
      problemStatement: project.problemAnalysis?.refinedStatement || project.description,
      existingLimitations: (project.problemAnalysis?.currentChallenges || []).join('\n'),
      proposedSolution: selectedSolution?.shortDescription || '',
      innovation: selectedSolution?.workingPrinciple || '',
      technologyStack: (selectedSolution?.requiredTechnologies || []).join(', '),
      implementationPlan: (project.roadmapPhases || []).map((p) => `${p.title}: ${p.objective}`).join('\n'),
      expectedImpact: (project.problemAnalysis?.possibleImpact || []).join('\n'),
      futureScope: '',
      updatedAt: project.updatedAt,
    };

  const handleAnalyzeProblem = async () => {
    setAiLoading('analyze');
    try {
      const res = await api.discoverAnalyze({
        title: project.title,
        domain: project.domain,
        targetAudience: project.targetAudience || 'End users',
        description: project.description || project.title,
        supportingInfo: project.supportingInfo,
      });
      const upd = await api.updateProject(project.id, { problemAnalysis: res.analysis });
      setProjects((prev) => prev.map((p) => (p.id === upd.project.id ? upd.project : p)));
      pushToast('Problem brief analyzed', 'success');
    } catch (err) {
      pushToast('Analysis failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateSolutions = async () => {
    setAiLoading('solutions');
    try {
      const res = await api.compareSolutions({
        projectId: project.id,
        title: project.title,
        domain: project.domain,
        description: project.description || project.title,
        targetAudience: project.targetAudience || 'End users',
        constraints: project.supportingInfo,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, solutions: res.solutions } : p))
      );
      pushToast('Generated 3 solution alternatives', 'success');
    } catch (err) {
      pushToast('Solution generation failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(null);
    }
  };

  const handleSelectSolution = async (solId: string) => {
    try {
      const upd = await api.updateProject(project.id, { selectedSolutionId: solId });
      setProjects((prev) => prev.map((p) => (p.id === upd.project.id ? upd.project : p)));
      pushToast('Primary solution direction updated', 'success');
    } catch {
      // ignore
    }
  };

  const handleGenerateRoadmap = async () => {
    setAiLoading('roadmap');
    try {
      const res = await api.generateRoadmap({
        projectId: project.id,
        title: project.title,
        domain: project.domain,
        description: project.description || project.title,
        selectedSolution: selectedSolution
          ? `${selectedSolution.name}: ${selectedSolution.shortDescription}`
          : undefined,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, roadmapPhases: res.phases } : p))
      );
      if (res.createdTasks.length > 0) {
        setTasks((prev) => [...res.createdTasks, ...prev]);
      }
      pushToast('Roadmap & milestone tasks generated', 'success');
    } catch (err) {
      pushToast('Roadmap generation failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(null);
    }
  };

  const handleGeneratePitch = async () => {
    setAiLoading('pitch');
    try {
      const res = await api.generatePitch({
        projectId: project.id,
        title: project.title,
        domain: project.domain,
        description: project.description || project.title,
        targetAudience: project.targetAudience || 'Target stakeholders',
        selectedSolution: selectedSolution
          ? `${selectedSolution.name}: ${selectedSolution.shortDescription}`
          : undefined,
      });
      setPitchDraft(res.pitch);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, pitch: res.pitch } : p)));
      pushToast('9-section pitch drafted', 'success');
    } catch (err) {
      pushToast('Pitch generation failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(null);
    }
  };

  const handleSavePitch = async () => {
    try {
      const toSave = { ...activePitch, updatedAt: new Date().toISOString() };
      const upd = await api.updateProject(project.id, { pitch: toSave });
      setProjects((prev) => prev.map((p) => (p.id === upd.project.id ? upd.project : p)));
      setPitchDraft(null);
      pushToast('Pitch saved', 'success');
    } catch (err) {
      pushToast('Failed to save pitch', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleExportPitchPdf = () => {
    exportDocumentToPdf({
      title: activePitch.projectTitle || project.title,
      subtitle: `${project.domain} · Innovation Pitch Brief`,
      sections: [
        { heading: '1. Problem Statement', content: activePitch.problemStatement },
        { heading: '2. Existing Limitations', content: activePitch.existingLimitations },
        { heading: '3. Proposed Solution', content: activePitch.proposedSolution },
        { heading: '4. Core Innovation', content: activePitch.innovation },
        { heading: '5. Technology Stack', content: activePitch.technologyStack },
        { heading: '6. Implementation Plan', content: activePitch.implementationPlan },
        { heading: '7. Expected Impact', content: activePitch.expectedImpact },
        { heading: '8. Future Scope', content: activePitch.futureScope },
      ],
      filename: `${project.title}-pitch`,
    });
    pushToast('PDF exported', 'success');
  };

  const openTaskForm = (task?: ProjectTask) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskPriority(task.priority);
      setTaskDeadline(task.deadline);
      setTaskAssignee(task.assigneeName || '');
    } else {
      setEditingTask(null);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
      setTaskDeadline(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10));
      setTaskAssignee('');
    }
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      if (editingTask) {
        const res = await api.updateTask(editingTask.id, {
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          deadline: taskDeadline,
          assigneeName: taskAssignee,
        });
        setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, progress: res.projectProgress } : p))
        );
        pushToast('Task updated', 'success');
      } else {
        const res = await api.createTask({
          projectId: project.id,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          deadline: taskDeadline,
          assigneeName: taskAssignee,
        });
        setTasks((prev) => [res.task, ...prev]);
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, progress: res.projectProgress } : p))
        );
        pushToast('Task added', 'success');
      }
      setTaskModalOpen(false);
    } catch (err) {
      pushToast('Task save failed', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleTaskStatusChange = async (task: ProjectTask, status: TaskStatus) => {
    try {
      const res = await api.updateTask(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, progress: res.projectProgress } : p))
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteTask = async () => {
    if (!taskDeleteTarget) return;
    try {
      const res = await api.deleteTask(taskDeleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskDeleteTarget.id));
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, progress: res.projectProgress } : p))
      );
      setTaskDeleteTarget(null);
      pushToast('Task removed', 'info');
    } catch {
      // ignore
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSaving(true);
    try {
      const res = await api.addComment({ projectId: project.id, content: commentText });
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      pushToast('Comment failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleAssistantSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput('');
    setAiLoading('chat');
    try {
      const contextSummary = [
        `Description: ${project.description}`,
        project.problemAnalysis ? `Refined Problem: ${project.problemAnalysis.refinedStatement}` : '',
        selectedSolution ? `Selected Solution: ${selectedSolution.name} — ${selectedSolution.shortDescription}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await api.runStudioTool({
        toolId: 'project_chat',
        promptInput: question,
        context: contextSummary,
        projectTitle: project.title,
        domain: project.domain,
        history: chatMessages,
      });

      setChatMessages((prev) => [
        ...prev,
        { role: 'user', text: question },
        { role: 'model', text: res.result.summary },
      ]);
    } catch (err) {
      pushToast('Assistant error', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb + Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/projects')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#777789] hover:text-[#7955E8] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </button>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            {project.title}
          </h1>
          <div className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">
            <span>{project.domain}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{project.status}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.progress}% complete</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-xs font-semibold hover:border-[#7955E8]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('pitch')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Pitch Builder</span>
          </button>
        </div>
      </div>

      {/* 10 Internal Navigation Tabs */}
      <div className="border-b border-[#ECECF2] dark:border-[#23263A] overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max pb-px" aria-label="Project Workspace Tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === t.id
                  ? 'border-[#7955E8] text-[#7955E8]'
                  : 'border-transparent text-[#777789] dark:text-[#9C9DB2] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <ProjectCoverIllustration theme={project.coverTheme} domain={project.domain} className="h-44 mb-5" />
              <h2 className="font-display font-bold text-lg mb-2">Project Summary</h2>
              <p className="text-sm text-[#424256] dark:text-[#C8C9DA] leading-relaxed">
                {project.description || 'No description added yet.'}
              </p>
              {project.targetAudience && (
                <div className="mt-4 pt-4 border-t border-[#ECECF2] dark:border-[#23263A] text-xs text-[#777789]">
                  <span className="font-semibold text-[#171725] dark:text-[#F4F4FA]">Target Audience: </span>
                  {project.targetAudience}
                </div>
              )}
            </div>

            {selectedSolution && (
              <div className="rounded-2xl bg-[#EEE8FF]/60 dark:bg-[#231D3A] border border-[#7955E8]/25 p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#7955E8] dark:text-[#C5B3FF]">
                    Primary Solution Direction
                  </span>
                  <button
                    type="button"
                    onClick={() => switchTab('comparison')}
                    className="text-xs font-semibold text-[#7955E8] hover:underline"
                  >
                    Compare Alternatives
                  </button>
                </div>
                <h3 className="font-display font-bold text-base">{selectedSolution.name}</h3>
                <p className="text-xs text-[#555568] dark:text-[#C8C9DA] mt-1.5 leading-relaxed">
                  {selectedSolution.shortDescription}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5 space-y-4">
              <h3 className="font-display font-bold text-sm">Execution Snapshot</h3>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#777789]">Overall Progress</span>
                  <span className="font-mono tabular-nums font-semibold">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F8F8FC] dark:bg-[#1C1F2E] overflow-hidden">
                  <div className="h-full rounded-full bg-[#7955E8]" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3">
                  <span className="text-[#777789]">Tasks</span>
                  <p className="font-mono tabular-nums font-bold text-lg mt-0.5">{projectTasks.length}</p>
                </div>
                <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3">
                  <span className="text-[#777789]">Roadmap Phases</span>
                  <p className="font-mono tabular-nums font-bold text-lg mt-0.5">
                    {project.roadmapPhases?.length || 0}
                  </p>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => switchTab('brief')}
                  className="w-full text-left px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8] flex items-center justify-between"
                >
                  <span>01. Problem Brief</span>
                  <Compass className="w-3.5 h-3.5 text-[#7955E8]" />
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('solutions')}
                  className="w-full text-left px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8] flex items-center justify-between"
                >
                  <span>02. Solution Options</span>
                  <Layers className="w-3.5 h-3.5 text-[#7955E8]" />
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('roadmap')}
                  className="w-full text-left px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8] flex items-center justify-between"
                >
                  <span>03. Execution Roadmap</span>
                  <GitBranch className="w-3.5 h-3.5 text-[#7955E8]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEM BRIEF */}
      {activeTab === 'brief' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg">Problem Brief & Research Scope</h2>
              <p className="text-xs text-[#777789]">
                Structured problem breakdown, research questions, and innovation opportunities.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAnalyzeProblem}
              disabled={aiLoading === 'analyze'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] disabled:opacity-60"
            >
              {aiLoading === 'analyze' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{project.problemAnalysis ? 'Refresh Analysis with Gemini' : 'Analyze Problem with Gemini'}</span>
            </button>
          </div>

          {!project.problemAnalysis ? (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-8 text-center">
              <p className="text-sm font-semibold">No structured problem brief generated yet</p>
              <p className="text-xs text-[#777789] mt-1 max-w-md mx-auto">
                Click "Analyze Problem with Gemini" above to synthesize root causes, stakeholders,
                missing information, and research questions from your project description.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
                <h3 className="font-display font-bold text-sm text-[#7955E8] mb-2">Executive Summary</h3>
                <p className="text-sm leading-relaxed">{project.problemAnalysis.summary}</p>
              </div>
              <div className="rounded-2xl bg-[#EEE8FF]/50 dark:bg-[#231D3A] border border-[#7955E8]/20 p-5">
                <h3 className="font-display font-bold text-sm text-[#7955E8] dark:text-[#C5B3FF] mb-2">
                  Refined Problem Statement
                </h3>
                <p className="text-sm font-medium leading-relaxed">
                  {project.problemAnalysis.refinedStatement}
                </p>
              </div>
              {[
                { label: 'Research Questions', items: project.problemAnalysis.researchQuestions },
                { label: 'Missing Information', items: project.problemAnalysis.missingInformation },
                { label: 'Opportunities for Innovation', items: project.problemAnalysis.opportunities },
              ].map((block) => (
                <div
                  key={block.label}
                  className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5"
                >
                  <h3 className="font-display font-bold text-sm mb-3">{block.label}</h3>
                  <ul className="space-y-2 text-xs text-[#424256] dark:text-[#C8C9DA]">
                    {block.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#7955E8] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROOT CAUSES */}
      {activeTab === 'causes' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg">Root Causes & Current Challenges</h2>
              <p className="text-xs text-[#777789]">
                Distinguish surface symptoms from underlying structural constraints.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAnalyzeProblem}
              disabled={aiLoading === 'analyze'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading === 'analyze' ? 'Analyzing...' : 'Run Root Cause Analysis'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <h3 className="font-display font-bold text-base mb-3">Root Causes</h3>
              {project.problemAnalysis?.rootCauses?.length ? (
                <ul className="space-y-2.5 text-sm text-[#424256] dark:text-[#C8C9DA]">
                  {project.problemAnalysis.rootCauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-[#7955E8] mt-1">0{i + 1}.</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#777789]">Run problem analysis to map root causes.</p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <h3 className="font-display font-bold text-base mb-3">Operational & Technical Challenges</h3>
              {project.problemAnalysis?.currentChallenges?.length ? (
                <ul className="space-y-2.5 text-sm text-[#424256] dark:text-[#C8C9DA]">
                  {project.problemAnalysis.currentChallenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-[#FF895E] mt-1">0{i + 1}.</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#777789]">Run problem analysis to document challenges.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STAKEHOLDERS */}
      {activeTab === 'stakeholders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5">
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#7955E8]" />
                <h2 className="font-display font-bold text-base">Affected Stakeholders</h2>
              </div>
              {project.problemAnalysis?.stakeholders?.length ? (
                <ul className="space-y-2 text-sm text-[#424256] dark:text-[#C8C9DA]">
                  {project.problemAnalysis.stakeholders.map((s, i) => (
                    <li key={i} className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#777789]">
                  Primary Target Audience: {project.targetAudience || 'Not specified yet.'}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
              <h3 className="font-display font-bold text-base mb-3">Expected Real-World Impact</h3>
              {project.problemAnalysis?.possibleImpact?.length ? (
                <ul className="space-y-2 text-xs text-[#424256] dark:text-[#C8C9DA]">
                  {project.problemAnalysis.possibleImpact.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2EA87E] shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#777789]">Run Gemini analysis in Problem Brief to generate impact targets.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
            <h2 className="font-display font-bold text-base mb-3">Stakeholder & Team Notes</h2>
            <form onSubmit={handlePostComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Log interview findings or collaborator notes..."
                className="flex-1 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={commentSaving}
                className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
              >
                Post
              </button>
            </form>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {projectComments.length === 0 ? (
                <p className="text-xs text-[#777789]">No stakeholder notes recorded yet.</p>
              ) : (
                projectComments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-3.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#777789]">
                      <span className="font-semibold text-[#171725] dark:text-[#F4F4FA]">
                        {c.authorName} · {c.authorRole}
                      </span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SOLUTIONS (3 CARDS) */}
      {activeTab === 'solutions' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg">Three Alternative Solution Pathways</h2>
              <p className="text-xs text-[#777789]">
                Note: Complexity and impact ratings below are AI-generated estimates for comparison, not verified benchmarks.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSolutions}
              disabled={aiLoading === 'solutions'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] disabled:opacity-60"
            >
              {aiLoading === 'solutions' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{project.solutions?.length ? 'Regenerate 3 Solutions' : 'Generate 3 Solutions'}</span>
            </button>
          </div>

          {!project.solutions?.length ? (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-10 text-center">
              <p className="text-sm font-semibold">No solution alternatives generated yet</p>
              <p className="text-xs text-[#777789] mt-1">
                Let Gemini propose three distinct architectures so you can compare tradeoffs before building.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {project.solutions.map((sol, idx) => {
                const isSelected = project.selectedSolutionId === sol.id;
                return (
                  <div
                    key={sol.id}
                    className={`rounded-2xl bg-white dark:bg-[#151722] border p-5 flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#7955E8] ring-2 ring-[#7955E8]/15'
                        : 'border-[#ECECF2] dark:border-[#23263A]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[#7955E8] font-semibold">
                          Option 0{idx + 1} · AI Estimate
                        </span>
                        {isSelected && (
                          <span className="font-semibold text-[#16A34A]">Selected Direction</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base">{sol.name}</h3>
                      <p className="text-xs text-[#424256] dark:text-[#C8C9DA] leading-relaxed">
                        {sol.shortDescription}
                      </p>

                      <div className="pt-2 border-t border-[#ECECF2] dark:border-[#23263A]">
                        <p className="text-[11px] font-semibold text-[#777789] mb-1">Working Principle</p>
                        <p className="text-xs leading-relaxed">{sol.workingPrinciple}</p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-[#777789] mb-1">Required Technologies</p>
                        <p className="text-xs font-medium text-[#171725] dark:text-[#F4F4FA]">
                          {sol.requiredTechnologies.join(' · ')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="rounded-lg bg-[#F8F8FC] dark:bg-[#1C1F2E] p-2">
                          <span className="text-[10px] text-[#777789] block">Est. Complexity</span>
                          <span className="font-semibold">{sol.estimatedComplexity}</span>
                        </div>
                        <div className="rounded-lg bg-[#F8F8FC] dark:bg-[#1C1F2E] p-2">
                          <span className="text-[10px] text-[#777789] block">Est. Impact</span>
                          <span className="font-semibold">{sol.potentialImpact}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-[#16A34A] mb-1">Advantages</p>
                        <ul className="space-y-1 text-xs text-[#424256] dark:text-[#C8C9DA]">
                          {sol.advantages.map((a, i) => (
                            <li key={i}>• {a}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-[#D97706] mb-1">Limitations & Risks</p>
                        <ul className="space-y-1 text-xs text-[#424256] dark:text-[#C8C9DA]">
                          {[...sol.limitations, ...sol.risks].map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectSolution(sol.id)}
                      className={`mt-5 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8]'
                          : 'bg-[#7955E8] text-white hover:bg-[#6641D9]'
                      }`}
                    >
                      {isSelected ? 'Selected as Main Direction' : 'Select as Main Direction'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: COMPARISON TABLE */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#7955E8]" />
                <span>Side-by-Side Solution Matrix</span>
              </h2>
              <p className="text-xs text-[#777789]">
                All complexity and impact columns represent AI-estimated tradeoffs for planning.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSolutions}
              disabled={aiLoading === 'solutions'}
              className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              {aiLoading === 'solutions' ? 'Generating...' : 'Generate / Refresh Matrix'}
            </button>
          </div>

          {!project.solutions?.length ? (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-8 text-center text-xs text-[#777789]">
              Generate solutions first to view the structured comparison matrix.
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#ECECF2] dark:border-[#23263A] text-xs text-[#777789]">
                    <th className="py-3.5 px-5 font-semibold w-44">Dimension</th>
                    {project.solutions.map((sol) => (
                      <th key={sol.id} className="py-3.5 px-4 font-bold text-[#171725] dark:text-[#F4F4FA]">
                        {sol.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECF2] dark:divide-[#23263A] text-xs">
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Working Principle</td>
                    {project.solutions.map((s) => (
                      <td key={s.id} className="py-3 px-4 leading-relaxed">{s.workingPrinciple}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Est. Complexity</td>
                    {project.solutions.map((s) => (
                      <td key={s.id} className="py-3 px-4 font-semibold">{s.estimatedComplexity} (Est.)</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Est. Impact</td>
                    {project.solutions.map((s) => (
                      <td key={s.id} className="py-3 px-4 font-semibold">{s.potentialImpact} (Est.)</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Core Technologies</td>
                    {project.solutions.map((s) => (
                      <td key={s.id} className="py-3 px-4">{s.requiredTechnologies.join(', ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Key Risks</td>
                    {project.solutions.map((s) => (
                      <td key={s.id} className="py-3 px-4">{s.risks.join(' · ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold text-[#777789]">Decision</td>
                    {project.solutions.map((s) => {
                      const active = project.selectedSolutionId === s.id;
                      return (
                        <td key={s.id} className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleSelectSolution(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              active
                                ? 'bg-[#EEE8FF] text-[#7955E8]'
                                : 'bg-[#7955E8] text-white hover:bg-[#6641D9]'
                            }`}
                          >
                            {active ? 'Selected' : 'Choose Direction'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg">
                Turn ambitious goals into achievable milestones.
              </h2>
              <p className="text-xs text-[#777789]">
                Phased timeline with dependencies, testing gates, and concrete deliverables.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              disabled={aiLoading === 'roadmap'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] disabled:opacity-60"
            >
              {aiLoading === 'roadmap' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{project.roadmapPhases?.length ? 'Regenerate Roadmap' : 'Build Roadmap with Gemini'}</span>
            </button>
          </div>

          {!project.roadmapPhases?.length ? (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-10 text-center">
              <p className="text-sm font-semibold">No roadmap phases created yet</p>
              <p className="text-xs text-[#777789] mt-1">
                Generate an execution timeline with phases, verification tests, and auto-populated tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.roadmapPhases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] font-mono text-xs font-bold flex items-center justify-center">
                        0{idx + 1}
                      </span>
                      <h3 className="font-display font-bold text-base">{phase.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-[#7955E8] font-semibold">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-xs text-[#424256] dark:text-[#C8C9DA] mb-4">{phase.objective}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3.5">
                      <p className="font-semibold mb-1.5">Milestones</p>
                      <ul className="space-y-1 text-[#777789] dark:text-[#9C9DB2]">
                        {phase.milestones.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3.5">
                      <p className="font-semibold mb-1.5">Testing Requirements</p>
                      <ul className="space-y-1 text-[#777789] dark:text-[#9C9DB2]">
                        {phase.testingRequirements.map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3.5">
                      <p className="font-semibold mb-1.5">Deliverables</p>
                      <ul className="space-y-1 text-[#777789] dark:text-[#9C9DB2]">
                        {phase.deliverables.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#7955E8]" />
                <span>Project Tasks ({projectTasks.length})</span>
              </h2>
              <p className="text-xs text-[#777789]">
                Completing tasks automatically updates overall project execution progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openTaskForm()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {projectTasks.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-8 text-center text-xs text-[#777789]">
              No tasks yet. Add your first task or generate a roadmap to populate milestones automatically.
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] divide-y divide-[#ECECF2] dark:divide-[#23263A]">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F8FC]/70 dark:hover:bg-[#1C1F2E]/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleTaskStatusChange(task, task.status === 'Done' ? 'Todo' : 'Done')
                        }
                        aria-label={task.status === 'Done' ? 'Mark task incomplete' : 'Mark task complete'}
                        title={task.status === 'Done' ? 'Reopen task' : 'Complete task'}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          task.status === 'Done'
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'border-[#ECECF2] dark:border-[#2A2E45]'
                        }`}
                      >
                        {task.status === 'Done' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span
                        className={`text-sm font-semibold ${
                          task.status === 'Done' ? 'line-through text-[#777789]' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-[#777789] mt-1 pl-7">{task.description}</p>
                    )}
                    <div className="text-[11px] text-[#777789] mt-1.5 pl-7">
                      <span>Priority: {task.priority}</span>
                      <span className="mx-1.5">·</span>
                      <span className="font-mono">Due {task.deadline}</span>
                      {task.assigneeName && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span>Assignee: {task.assigneeName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task, e.target.value as TaskStatus)}
                      className="rounded-lg border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-2.5 py-1 text-xs font-medium"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => openTaskForm(task)}
                      aria-label="Edit task"
                      title="Edit task"
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskDeleteTarget(task)}
                      aria-label="Delete task"
                      title="Delete task"
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: PITCH BUILDER */}
      {activeTab === 'pitch' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg">9-Section Pitch Builder</h2>
              <p className="text-xs text-[#777789]">
                Edit every slide narrative, copy, save, or export directly as a clean PDF brief.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePitch}
                disabled={aiLoading === 'pitch'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-xs font-semibold hover:border-[#7955E8]"
              >
                {aiLoading === 'pitch' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#7955E8]" />
                )}
                <span>Draft with Gemini</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const text = Object.entries(activePitch)
                    .filter(([k]) => k !== 'updatedAt')
                    .map(([k, v]) => `## ${k}\n${v}`)
                    .join('\n\n');
                  await copyToClipboard(text);
                  pushToast('Pitch copied to clipboard', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-xs font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleSavePitch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Pitch</span>
              </button>
              <button
                type="button"
                onClick={handleExportPitchPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171725] dark:bg-white text-white dark:text-[#171725] text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                ['projectTitle', '1. Project Title', 1],
                ['problemStatement', '2. Problem Statement', 3],
                ['existingLimitations', '3. Existing Limitations', 3],
                ['proposedSolution', '4. Proposed Solution', 3],
                ['innovation', '5. Innovation & Differentiator', 3],
                ['technologyStack', '6. Technology Stack', 2],
                ['implementationPlan', '7. Implementation Plan', 3],
                ['expectedImpact', '8. Expected Impact', 3],
                ['futureScope', '9. Future Scope', 2],
              ] as Array<[keyof Omit<PitchDeckData, 'updatedAt'>, string, number]>
            ).map(([key, label, rows]) => (
              <div
                key={key}
                className={`rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 ${
                  key === 'projectTitle' ? 'md:col-span-2' : ''
                }`}
              >
                <label className="block text-xs font-semibold text-[#7955E8] mb-1.5">{label}</label>
                <textarea
                  rows={rows}
                  value={activePitch[key]}
                  onChange={(e) =>
                    setPitchDraft({
                      ...activePitch,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] p-3 text-xs leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: PROJECT ASSISTANT */}
      {activeTab === 'assistant' && (
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECECF2] dark:border-[#23263A] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#7955E8]" />
              <h2 className="font-display font-bold text-base">
                Contextual Assistant — {project.title}
              </h2>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-[#777789] py-10 text-center">
                Ask anything about technical architecture, validation experiments, or risks for this project.
              </p>
            ) : (
              chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#EEE8FF] dark:bg-[#251E42] ml-10'
                      : 'bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] mr-10'
                  }`}
                >
                  <div className="font-semibold text-[11px] text-[#7955E8] mb-1">
                    {m.role === 'user' ? 'You' : 'NEXUS Project Assistant'}
                  </div>
                  {m.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAssistantSend} className="flex gap-2.5 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about implementation details, testing, or pitch questions..."
              className="flex-1 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={aiLoading === 'chat'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] disabled:opacity-60"
            >
              {aiLoading === 'chat' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}

      {/* Edit Project Modal */}
      <ProjectFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingProject={project}
      />

      {/* Task Form Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Project Task'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Benchmark API latency under 50 concurrent requests"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Description</label>
            <textarea
              rows={2}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Deadline</label>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Assignee (optional)</label>
            <input
              type="text"
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              placeholder="Team member name"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTaskModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              {editingTask ? 'Save Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(taskDeleteTarget)}
        onClose={() => setTaskDeleteTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Remove "${taskDeleteTarget?.title}" from this project?`}
        confirmLabel="Delete Task"
      />
    </div>
  );
}
