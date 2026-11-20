import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import {
  PROJECT_DOMAINS,
  type Project,
  type ProjectCoverTheme,
  type ProjectDomain,
  type ProjectStatus,
} from '../types/nexus';

export function ToastContainer() {
  const { toasts, dismissToast } = useWorkspace();
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl bg-white dark:bg-[#1A1C2A] border border-[#ECECF2] dark:border-[#2A2E45] p-3.5 shadow-[0_12px_32px_-8px_rgba(23,23,37,0.16)]"
          >
            {t.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />}
            {t.variant === 'error' && <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />}
            {t.variant === 'info' && <Info className="w-4 h-4 text-[#7955E8] shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#171725] dark:text-[#F4F4FA]">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              title="Dismiss"
              className="p-1 rounded-md text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] focus-visible:outline-2 focus-visible:outline-[#7955E8]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidth = 'max-w-lg',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#171725]/45 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] shadow-[0_24px_64px_-16px_rgba(23,23,37,0.28)] overflow-hidden`}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#ECECF2] dark:border-[#23263A]">
              <div>
                <h2 id="modal-title" className="font-display font-bold text-lg text-[#171725] dark:text-[#F4F4FA]">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                title="Close"
                className="p-2 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] transition-colors focus-visible:outline-2 focus-visible:outline-[#7955E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-[#777789] dark:text-[#9C9DB2] leading-relaxed">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-[#171725] dark:text-[#F4F4FA] hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors whitespace-nowrap shrink-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const COVER_THEME_OPTIONS: Array<{ value: ProjectCoverTheme; label: string; swatch: string }> = [
  { value: 'lavender', label: 'Lavender', swatch: '#7955E8' },
  { value: 'cyan', label: 'Sky Cyan', swatch: '#63CBEA' },
  { value: 'coral', label: 'Warm Coral', swatch: '#FF895E' },
  { value: 'rose', label: 'Soft Rose', swatch: '#F47BA7' },
  { value: 'mint', label: 'Sage Mint', swatch: '#2EA87E' },
  { value: 'amber', label: 'Amber Gold', swatch: '#E5953B' },
];

export function ProjectFormModal({
  open,
  onClose,
  editingProject,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editingProject?: Project | null;
  onSaved?: (project: Project) => void;
}) {
  const { setProjects, pushToast } = useWorkspace();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<ProjectDomain>('Technology');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [coverTheme, setCoverTheme] = useState<ProjectCoverTheme>('lavender');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDomain(editingProject.domain);
      setStatus(editingProject.status);
      setTargetAudience(editingProject.targetAudience);
      setDescription(editingProject.description);
      setCoverTheme(editingProject.coverTheme);
    } else {
      setTitle('');
      setDomain('Technology');
      setStatus('Planning');
      setTargetAudience('');
      setDescription('');
      setCoverTheme('lavender');
    }
    setError('');
  }, [editingProject, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError('Please enter a descriptive project title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingProject) {
        const res = await api.updateProject(editingProject.id, {
          title,
          domain,
          status,
          targetAudience,
          description,
          coverTheme,
        });
        setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
        pushToast('Project updated', 'success', res.project.title);
        onSaved?.(res.project);
      } else {
        const res = await api.createProject({
          title,
          domain,
          status,
          targetAudience,
          description,
          coverTheme,
        });
        setProjects((prev) => [res.project, ...prev]);
        pushToast('Project created', 'success', res.project.title);
        onSaved?.(res.project);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProject ? 'Edit Project Details' : 'Create Innovation Project'}
      description="Define the core problem context so AI Studio and Roadmap tools stay aligned."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] dark:border-[#7F1D1D] px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-[#FCA5A5]">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Community Flood Early-Warning Sensor Grid"
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as ProjectDomain)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
            >
              {PROJECT_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
            Target Audience / Affected Group
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Rural clinic nurses and mobile health workers"
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
            Problem & Concept Summary
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the real-world gap, current constraints, and what you aim to build..."
            className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-2">
            Cover Accent Palette
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {COVER_THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCoverTheme(opt.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  coverTheme === opt.value
                    ? 'border-[#7955E8] bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF]'
                    : 'border-[#ECECF2] dark:border-[#2A2E45] text-[#777789] dark:text-[#9C9DB2] hover:text-[#171725] dark:hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: opt.swatch }} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-[#171725] dark:text-[#F4F4FA] hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-[#7955E8] text-white hover:bg-[#6641D9] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-4 animate-pulse">
      <div className="h-32 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] mb-4" />
      <div className="h-4 w-2/3 rounded bg-[#F8F8FC] dark:bg-[#1C1F2E] mb-2" />
      <div className="h-3 w-full rounded bg-[#F8F8FC] dark:bg-[#1C1F2E] mb-1.5" />
      <div className="h-3 w-4/5 rounded bg-[#F8F8FC] dark:bg-[#1C1F2E] mb-4" />
      <div className="h-2 w-full rounded bg-[#F8F8FC] dark:bg-[#1C1F2E]" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] px-6 py-12 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA]">{title}</h3>
      <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-4 py-2 text-sm font-semibold rounded-xl bg-[#7955E8] text-white hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
