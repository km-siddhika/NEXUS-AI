import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Bookmark,
  Copy,
  Edit3,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ProjectCoverIllustration } from '../components/ProjectArtwork';
import {
  ConfirmDialog,
  EmptyState,
  ProjectFormModal,
  SkeletonCard,
} from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import { PROJECT_DOMAINS, type Project, type ProjectDomain, type ProjectStatus } from '../types/nexus';

type StatusFilter = 'All' | ProjectStatus | 'Archived';
type SortKey = 'updated' | 'progress' | 'title';

export default function ProjectsPage() {
  const { projects, workspaceLoading, setProjects, pushToast } = useWorkspace();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<'All' | ProjectDomain>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortKey>('updated');

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (statusFilter === 'Archived') return p.archived;
        if (p.archived) return false;
        if (statusFilter !== 'All' && p.status !== statusFilter) return false;
        if (domainFilter !== 'All' && p.domain !== domainFilter) return false;
        if (
          q &&
          !p.title.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.domain.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return b.progress - a.progress;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [projects, search, domainFilter, statusFilter, sortBy]);

  const handleDuplicate = async (p: Project) => {
    try {
      const res = await api.duplicateProject(p.id);
      setProjects((prev) => [res.project, ...prev]);
      pushToast('Project duplicated', 'success', res.project.title);
    } catch (err) {
      pushToast('Error', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleToggleArchive = async (p: Project) => {
    try {
      const res = await api.updateProject(p.id, { archived: !p.archived });
      setProjects((prev) => prev.map((item) => (item.id === res.project.id ? res.project : item)));
      pushToast(res.project.archived ? 'Project archived' : 'Project restored', 'info');
    } catch {
      // ignore
    }
  };

  const handleToggleBookmark = async (p: Project) => {
    try {
      const res = await api.updateProject(p.id, { bookmarked: !p.bookmarked });
      setProjects((prev) => prev.map((item) => (item.id === res.project.id ? res.project : item)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#7955E8] mb-1">Projects Workspace</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            Your innovation journey, all in one place.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {/* Filters & Controls Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#777789] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, domain, or description..."
              aria-label="Filter projects"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] pl-10 pr-3.5 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by domain"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as 'All' | ProjectDomain)}
              className="rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs font-medium"
            >
              <option value="All">All Domains</option>
              {PROJECT_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort projects"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs font-medium"
            >
              <option value="updated">Sort: Recently Updated</option>
              <option value="progress">Sort: Progress</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#151722] text-[#7955E8] shadow-xs'
                    : 'text-[#777789]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#151722] text-[#7955E8] shadow-xs'
                    : 'text-[#777789]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] w-fit">
          {(['All', 'Planning', 'In Progress', 'Completed', 'Archived'] as StatusFilter[]).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-white dark:bg-[#151722] text-[#7955E8] shadow-xs'
                    : 'text-[#777789] hover:text-[#171725] dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      {workspaceLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No matching projects"
          description="Try clearing your search or status filter, or start a brand new innovation project."
          actionLabel="Create Project"
          onAction={() => setCreateOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 flex flex-col justify-between hover:border-[#7955E8]/40 transition-colors"
            >
              <div>
                <Link to={`/app/projects/${proj.id}`} className="block">
                  <ProjectCoverIllustration
                    theme={proj.coverTheme}
                    domain={proj.domain}
                    className="h-36 mb-4"
                  />
                </Link>
                <div className="text-xs text-[#777789] dark:text-[#9C9DB2]">
                  <span>{proj.domain}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{proj.status}</span>
                </div>
                <Link
                  to={`/app/projects/${proj.id}`}
                  className="block font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] hover:text-[#7955E8] mt-1 truncate"
                >
                  {proj.title}
                </Link>
                <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-2 line-clamp-2 leading-relaxed">
                  {proj.description || 'No summary added yet.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#ECECF2] dark:border-[#23263A]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#777789]">Completion</span>
                  <span className="font-mono tabular-nums font-semibold">{proj.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F8F8FC] dark:bg-[#1C1F2E] overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-[#7955E8]" style={{ width: `${proj.progress}%` }} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/app/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7955E8] hover:underline"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(proj)}
                      aria-label={proj.bookmarked ? 'Remove bookmark' : 'Bookmark project'}
                      title={proj.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#7955E8] hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${proj.bookmarked ? 'fill-[#7955E8] text-[#7955E8]' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(proj)}
                      aria-label="Edit project"
                      title="Edit"
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(proj)}
                      aria-label="Duplicate project"
                      title="Duplicate"
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(proj)}
                      aria-label={proj.archived ? 'Restore project' : 'Archive project'}
                      title={proj.archived ? 'Restore' : 'Archive'}
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
                    >
                      {proj.archived ? (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(proj)}
                      aria-label="Delete project"
                      title="Delete"
                      className="p-1.5 rounded-lg text-[#777789] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#3A1C1E]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ECECF2] dark:border-[#23263A] text-xs text-[#777789]">
                <th className="py-3.5 px-5 font-semibold">Project</th>
                <th className="py-3.5 px-4 font-semibold">Domain</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Progress</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECECF2] dark:divide-[#23263A] text-sm">
              {filtered.map((proj) => (
                <tr key={proj.id} className="hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]/60">
                  <td className="py-3.5 px-5 font-semibold">
                    <Link to={`/app/projects/${proj.id}`} className="hover:text-[#7955E8]">
                      {proj.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#777789]">{proj.domain}</td>
                  <td className="py-3.5 px-4 text-xs font-medium">{proj.status}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-semibold">
                    {proj.progress}%
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(proj)}
                        aria-label="Edit project"
                        title="Edit"
                        className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(proj)}
                        aria-label="Duplicate project"
                        title="Duplicate"
                        className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(proj)}
                        aria-label={proj.archived ? 'Restore project' : 'Archive project'}
                        title={proj.archived ? 'Restore' : 'Archive'}
                        className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white"
                      >
                        {proj.archived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(proj)}
                        aria-label="Delete project"
                        title="Delete"
                        className="p-1.5 rounded-lg text-[#777789] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectFormModal
        open={createOpen || Boolean(editing)}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        editingProject={editing}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Permanently delete "${deleteTarget?.title}" and all linked tasks and comments?`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
