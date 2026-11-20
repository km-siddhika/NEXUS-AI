import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, Modal } from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { Team, TeamRole } from '../types/nexus';

const TEAM_ROLES: TeamRole[] = ['Lead', 'Researcher', 'Engineer', 'Designer'];

export default function CollaboratePage() {
  const { user, teams, projects, comments, setTeams, setComments, pushToast } = useWorkspace();

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<TeamRole>('Researcher');

  const [removeTarget, setRemoveTarget] = useState<{
    teamId: string;
    memberId: string;
    memberName: string;
  } | null>(null);

  const [commentProjectId, setCommentProjectId] = useState<string>(projects[0]?.id || '');
  const [commentText, setCommentText] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      const res = await api.createTeam({
        name: teamName,
        description: teamDesc,
        projectIds: selectedProjectIds,
      });
      setTeams((prev) => [res.team, ...prev]);
      setCreateTeamOpen(false);
      setTeamName('');
      setTeamDesc('');
      setSelectedProjectIds([]);
      pushToast('Team created', 'success', res.team.name);
    } catch (err) {
      pushToast('Team creation failed', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTeamId) return;
    try {
      const res = await api.inviteMember(inviteTeamId, {
        name: memberName,
        email: memberEmail,
        role: memberRole,
      });
      setTeams((prev) => prev.map((t) => (t.id === res.team.id ? res.team : t)));
      setInviteTeamId(null);
      setMemberName('');
      setMemberEmail('');
      pushToast('Collaborator added', 'success');
    } catch (err) {
      pushToast('Invite failed', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleRoleChange = async (team: Team, memberId: string, role: TeamRole) => {
    try {
      const res = await api.updateMemberRole(team.id, memberId, role);
      setTeams((prev) => prev.map((t) => (t.id === res.team.id ? res.team : t)));
      pushToast('Role updated', 'info');
    } catch (err) {
      pushToast('Permission denied', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      const res = await api.removeMember(removeTarget.teamId, removeTarget.memberId);
      setTeams((prev) => prev.map((t) => (t.id === res.team.id ? res.team : t)));
      setRemoveTarget(null);
      pushToast('Member removed', 'info');
    } catch (err) {
      pushToast('Error', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentProjectId || !commentText.trim()) return;
    try {
      const res = await api.addComment({ projectId: commentProjectId, content: commentText });
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
      pushToast('Note posted', 'success');
    } catch (err) {
      pushToast('Failed to post', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#7955E8] mb-1">
            Team Collaboration & Shared Workspaces
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            Build together with clear roles.
          </h1>
          <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">
            All member permissions, shared projects, and discussion notes persist securely on the server (refresh to sync updates from teammates).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateTeamOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No collaboration teams yet"
          description="Create an interdisciplinary team, link shared projects, and invite researchers or engineers with explicit roles."
          actionLabel="Create First Team"
          onAction={() => setCreateTeamOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => {
            const isOwner = team.ownerId === user?.id;
            const linkedProjects = projects.filter((p) => team.projectIds.includes(p.id));
            return (
              <div
                key={team.id}
                className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-lg">{team.name}</h2>
                      {isOwner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7955E8]">
                          <Shield className="w-3 h-3" />
                          <span>Owner</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">
                      {team.description || 'Shared innovation squad'}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setInviteTeamId(team.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF] text-xs font-semibold hover:bg-[#E2D7FF] shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </button>
                  )}
                </div>

                {/* Members */}
                <div>
                  <p className="text-xs font-semibold text-[#777789] mb-2">
                    Members ({team.members.length})
                  </p>
                  <div className="divide-y divide-[#ECECF2] dark:divide-[#23263A] border border-[#ECECF2] dark:border-[#23263A] rounded-xl">
                    {team.members.map((m) => (
                      <div key={m.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{m.name}</p>
                          <p className="text-[11px] text-[#777789] truncate">
                            {m.email} · {m.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner && m.id !== team.ownerId ? (
                            <select
                              aria-label={`Role for ${m.name}`}
                              value={m.role}
                              onChange={(e) => handleRoleChange(team, m.id, e.target.value as TeamRole)}
                              className="rounded-lg border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-2 py-1 text-[11px] font-medium"
                            >
                              {TEAM_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#777789]">{m.role}</span>
                          )}
                          {isOwner && m.id !== team.ownerId && (
                            <button
                              type="button"
                              onClick={() =>
                                setRemoveTarget({
                                  teamId: team.id,
                                  memberId: m.id,
                                  memberName: m.name,
                                })
                              }
                              aria-label={`Remove ${m.name}`}
                              title="Remove member"
                              className="p-1 text-[#777789] hover:text-[#DC2626]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked Shared Projects */}
                <div>
                  <p className="text-xs font-semibold text-[#777789] mb-2">Shared Projects</p>
                  {linkedProjects.length === 0 ? (
                    <p className="text-xs text-[#777789]">No projects linked to this team yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {linkedProjects.map((p) => (
                        <Link
                          key={p.id}
                          to={`/app/projects/${p.id}`}
                          className="block rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-xs font-semibold hover:text-[#7955E8]"
                        >
                          {p.title} · <span className="font-normal text-[#777789]">{p.status}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Discussion / Comments Stream */}
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-[#7955E8]" />
          <h2 className="font-display font-bold text-base">Shared Project Discussion</h2>
        </div>

        <form onSubmit={handleAddComment} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5">
          <select
            aria-label="Select project for comment"
            value={commentProjectId}
            onChange={(e) => setCommentProjectId(e.target.value)}
            className="md:col-span-4 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-xs"
          >
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share a decision, blocker, or testing update with your team..."
            className="md:col-span-6 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!commentProjectId}
            className="md:col-span-2 px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] disabled:opacity-50"
          >
            Post Note
          </button>
        </form>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-[#777789]">No discussion notes posted yet.</p>
          ) : (
            comments.slice(0, 10).map((c) => {
              const proj = projects.find((p) => p.id === c.projectId);
              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777789]">
                    <span>
                      <strong className="text-[#171725] dark:text-[#F4F4FA]">{c.authorName}</strong> ·{' '}
                      {c.authorRole}
                      {proj ? ` · ${proj.title}` : ''}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed">{c.content}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        title="Create Collaboration Team"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Team Name</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., HealthTech Sensors Team"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Team Focus</label>
            <textarea
              rows={2}
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              placeholder="Briefly describe the team's mission..."
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Link Shared Projects</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(p.id)}
                      onChange={(e) =>
                        setSelectedProjectIds((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                        )
                      }
                      className="rounded text-[#7955E8]"
                    />
                    <span className="truncate">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateTeamOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              Create Team
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        open={Boolean(inviteTeamId)}
        onClose={() => setInviteTeamId(null)}
        title="Invite Team Member"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Collaborator name"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="teammate@university.edu"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Role</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as TeamRole)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3 py-2 text-sm"
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteTeamId(null)}
              className="px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Remove ${removeTarget?.memberName} from this team? They will lose shared workspace access.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
