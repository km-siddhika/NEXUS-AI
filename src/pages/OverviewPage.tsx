import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Archive,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Edit3,
  FolderKanban,
  Layers,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProjectCoverIllustration } from '../components/ProjectArtwork';
import {
  ConfirmDialog,
  EmptyState,
  ProjectFormModal,
  SkeletonCard,
} from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { Project } from '../types/nexus';

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OverviewPage() {
  const { user, projects, tasks, activityLogs, workspaceLoading, setProjects, pushToast } =
    useWorkspace();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visibleProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const stats = useMemo(() => {
    const total = visibleProjects.length;
    const active = visibleProjects.filter((p) => p.status === 'In Progress').length;
    const completed = visibleProjects.filter((p) => p.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'Done').length;
    return { total, active, completed, pendingTasks };
  }, [visibleProjects, tasks]);

  const chartData = useMemo(() => {
    return visibleProjects.slice(0, 6).map((p) => ({
      name: p.title.length > 16 ? `${p.title.slice(0, 15)}…` : p.title,
      progress: p.progress,
      tasks: tasks.filter((t) => t.projectId === p.id).length,
    }));
  }, [visibleProjects, tasks]);

  const suggestedNext = useMemo(() => {
    const needsSolutions = visibleProjects.find((p) => !p.solutions || p.solutions.length === 0);
    if (needsSolutions) {
      return {
        title: `Compare 3 AI solution pathways for "${needsSolutions.title}"`,
        description:
          'Generate contrasting technical architectures and select a primary direction before building your roadmap.',
        cta: 'Open Solution Comparison',
        to: `/app/projects/${needsSolutions.id}?tab=comparison`,
      };
    }
    const needsPitch = visibleProjects.find((p) => !p.pitch);
    if (needsPitch) {
      return {
        title: `Draft a 9-section pitch outline for "${needsPitch.title}"`,
        description:
          'Turn your validated problem brief and solution architecture into a judge-ready PDF presentation.',
        cta: 'Open Pitch Builder',
        to: `/app/projects/${needsPitch.id}?tab=pitch`,
      };
    }
    return {
      title: 'Explore a new real-world problem in Discover',
      description:
        'Enter an observation or domain challenge and let Gemini map root causes, stakeholders, and opportunities.',
      cta: 'Go to Discover',
      to: '/app/discover',
    };
  }, [visibleProjects]);

  const handleDuplicate = async (project: Project) => {
    setMenuOpenId(null);
    try {
      const res = await api.duplicateProject(project.id);
      setProjects((prev) => [res.project, ...prev]);
      pushToast('Project duplicated', 'success', res.project.title);
    } catch (err) {
      pushToast('Duplicate failed', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleToggleBookmark = async (project: Project) => {
    setMenuOpenId(null);
    try {
      const res = await api.updateProject(project.id, { bookmarked: !project.bookmarked });
      setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
      pushToast(res.project.bookmarked ? 'Bookmarked' : 'Removed bookmark', 'info');
    } catch {
      // ignore
    }
  };

  const handleArchive = async (project: Project) => {
    setMenuOpenId(null);
    try {
      const res = await api.updateProject(project.id, { archived: true });
      setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
      pushToast('Project archived', 'info', project.title);
    } catch {
      // ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      pushToast('Project deleted', 'info', deleteTarget.title);
      setDeleteTarget(null);
    } catch (err) {
      pushToast('Delete failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#7955E8] mb-1">
            {user?.institution ? `${user.institution} · ` : ''}Workspace Overview
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            Good to see you again, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-1">
            Ready to turn another idea into impact? Your ideas are taking shape.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/app/discover"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] text-sm font-semibold text-[#171725] dark:text-[#F4F4FA] hover:border-[#7955E8]/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Compass className="w-4 h-4 text-[#7955E8]" />
            <span>Discover Problems</span>
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-[#777789] dark:text-[#9C9DB2]">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-[#7955E8]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3 text-[#171725] dark:text-[#F4F4FA]">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-[#777789] dark:text-[#9C9DB2]">
            <span className="text-xs font-medium">Active Projects</span>
            <Layers className="w-4 h-4 text-[#63CBEA]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3 text-[#171725] dark:text-[#F4F4FA]">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-[#777789] dark:text-[#9C9DB2]">
            <span className="text-xs font-medium">Completed Projects</span>
            <CheckCircle2 className="w-4 h-4 text-[#2EA87E]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3 text-[#171725] dark:text-[#F4F4FA]">
            {stats.completed}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-[#777789] dark:text-[#9C9DB2]">
            <span className="text-xs font-medium">Pending Tasks</span>
            <Clock className="w-4 h-4 text-[#FF895E]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3 text-[#171725] dark:text-[#F4F4FA]">
            {stats.pendingTasks}
          </p>
        </div>
      </div>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-[#171725] dark:text-[#F4F4FA]">
            Recent Projects
          </h2>
          <Link
            to="/app/projects"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7955E8] hover:underline"
          >
            <span>View all projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {workspaceLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : visibleProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No innovation projects yet"
            description="Create a new project manually or analyze a real-world problem in Discover to launch your first workspace."
            actionLabel="Create First Project"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProjects.slice(0, 6).map((proj, idx) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="relative rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 flex flex-col justify-between hover:border-[#7955E8]/40 transition-colors"
              >
                <div>
                  <Link to={`/app/projects/${proj.id}`} className="block">
                    <ProjectCoverIllustration
                      theme={proj.coverTheme}
                      domain={proj.domain}
                      className="h-36 mb-4"
                    />
                  </Link>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-[#777789] dark:text-[#9C9DB2] truncate">
                        <span>{proj.domain}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{proj.status}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{formatRelativeDate(proj.updatedAt)}</span>
                      </div>
                      <Link
                        to={`/app/projects/${proj.id}`}
                        className="block font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] hover:text-[#7955E8] transition-colors mt-1 truncate"
                      >
                        {proj.title}
                      </Link>
                    </div>

                    {/* Three-dot Menu */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === proj.id ? null : proj.id)}
                        aria-label={`Project actions for ${proj.title}`}
                        title="Project options"
                        className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {menuOpenId === proj.id && (
                        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#1A1C2A] border border-[#ECECF2] dark:border-[#2A2E45] shadow-lg py-1.5 z-20">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              setEditingProject(proj);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(proj)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{proj.bookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(proj)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(proj)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                          <div className="my-1 border-t border-[#ECECF2] dark:border-[#23263A]" />
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              setDeleteTarget(proj);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#3A1C1E] flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-2 line-clamp-2 leading-relaxed">
                    {proj.description || 'Open the project workspace to define your problem brief and roadmap.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ECECF2] dark:border-[#23263A]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#777789] dark:text-[#9C9DB2]">Progress</span>
                    <span className="font-mono tabular-nums font-semibold text-[#171725] dark:text-[#F4F4FA]">
                      {proj.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F8F8FC] dark:bg-[#1C1F2E] overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${proj.progress}%` }}
                      transition={{ duration: 0.45 }}
                      className="h-full rounded-full bg-[#7955E8]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/app/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#7955E8] hover:underline"
                    >
                      <span>Open Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {proj.bookmarked && (
                      <Bookmark className="w-3.5 h-3.5 text-[#7955E8] fill-[#7955E8]" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Grid: Analytics Chart + Quick AI Suggestion + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA]">
                Project Execution Progress
              </h2>
              <p className="text-xs text-[#777789] dark:text-[#9C9DB2]">
                Completion percentage across active workspace initiatives
              </p>
            </div>
            <Link to="/app/analytics" className="text-xs font-semibold text-[#7955E8] hover:underline">
              Full Analytics
            </Link>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[#777789]">
              Create a project to view progress analytics.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECF2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171725',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="progress" name="Progress (%)" fill="#7955E8" radius={[8, 8, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column: AI Suggestion + Activity */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick AI Suggestion Card */}
          <div className="rounded-2xl bg-[#EEE8FF] dark:bg-[#231D3A] border border-[#7955E8]/20 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7955E8] dark:text-[#C5B3FF]">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Next Step</span>
            </div>
            <h3 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mt-2">
              {suggestedNext.title}
            </h3>
            <p className="text-xs text-[#555568] dark:text-[#B8B9CC] mt-1.5 leading-relaxed">
              {suggestedNext.description}
            </p>
            <button
              type="button"
              onClick={() => navigate(suggestedNext.to)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] transition-colors"
            >
              <span>{suggestedNext.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
            <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-3">
              Recent Activity
            </h2>
            {activityLogs.length === 0 ? (
              <p className="text-xs text-[#777789]">No saved activity yet.</p>
            ) : (
              <div className="divide-y divide-[#ECECF2] dark:divide-[#23263A]">
                {activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] truncate">
                        {log.action}
                      </p>
                      <p className="text-[11px] text-[#777789] dark:text-[#9C9DB2] truncate">
                        {log.entityTitle}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#777789] shrink-0">
                      {formatRelativeDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectFormModal
        open={createOpen || Boolean(editingProject)}
        onClose={() => {
          setCreateOpen(false);
          setEditingProject(null);
        }}
        editingProject={editingProject}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}" and all of its tasks? This action cannot be undone.`}
        confirmLabel="Delete Project"
        loading={deleting}
      />
    </div>
  );
}
