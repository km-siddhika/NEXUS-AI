import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Moon,
  Save,
  Sparkles,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { UserRole } from '../types/nexus';

const ROLES: UserRole[] = ['Student', 'Developer', 'Researcher', 'Innovator', 'Hackathon Lead'];
const AVATAR_COLORS = ['#7955E8', '#F47BA7', '#FF895E', '#63CBEA', '#2EA87E'];

export function SettingsPage() {
  const { user, setUser, logout, pushToast } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'Innovator');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#7955E8');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [aiDepthPreference, setAiDepthPreference] = useState<
    'concise' | 'balanced' | 'comprehensive'
  >(user?.aiDepthPreference || 'balanced');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name,
        institution,
        role,
        avatarColor,
        themePreference: theme,
        notificationsEnabled,
        aiDepthPreference,
      });
      setUser(res.user);
      pushToast('Settings saved', 'success');
    } catch (err) {
      pushToast('Save failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      pushToast('Password updated', 'success');
    } catch (err) {
      pushToast('Password error', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setSavingPass(false);
    }
  };

  const handleThemeSwitch = async (next: 'light' | 'dark') => {
    setTheme(next);
    try {
      const res = await api.updateProfile({ themePreference: next });
      setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-xs font-semibold text-[#7955E8] mb-1">Account & Preferences</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">Settings</h1>
      </div>

      {/* Profile & Preferences Form */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-[#ECECF2] dark:border-[#23263A]">
          <UserIcon className="w-4 h-4 text-[#7955E8]" />
          <h2 className="font-display font-bold text-base">Profile Information</h2>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {user?.avatarInitials || 'NX'}
          </div>
          <div>
            <p className="text-xs font-semibold mb-2">Profile Accent Color</p>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  aria-label={`Select avatar color ${c}`}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    avatarColor === c ? 'ring-2 ring-offset-2 ring-[#7955E8] scale-105' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC]/60 dark:bg-[#1C1F2E]/60 px-3.5 py-2.5 text-sm text-[#777789] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Institution / Organization</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University, Lab, or Startup"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme & AI & Notification Preferences */}
        <div className="pt-4 border-t border-[#ECECF2] dark:border-[#23263A] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold mb-2">Interface Theme</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45]">
              <button
                type="button"
                onClick={() => handleThemeSwitch('light')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                  theme === 'light'
                    ? 'bg-white text-[#7955E8] shadow-xs'
                    : 'text-[#777789]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeSwitch('dark')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                  theme === 'dark'
                    ? 'bg-[#151722] text-[#C5B3FF] shadow-xs'
                    : 'text-[#777789]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">AI Analysis Depth</label>
            <select
              value={aiDepthPreference}
              onChange={(e) =>
                setAiDepthPreference(e.target.value as 'concise' | 'balanced' | 'comprehensive')
              }
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2 text-xs font-medium"
            >
              <option value="concise">Concise (Rapid summaries)</option>
              <option value="balanced">Balanced (Recommended)</option>
              <option value="comprehensive">Comprehensive (Deep technical detail)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="rounded text-[#7955E8]"
          />
          <span>Enable workspace milestone and collaborator notifications</span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* Security */}
      {!user?.isDemo && (
        <form
          onSubmit={handleUpdatePassword}
          className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-4"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-[#ECECF2] dark:border-[#23263A]">
            <Lock className="w-4 h-4 text-[#7955E8]" />
            <h2 className="font-display font-bold text-base">Security & Password</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPass}
              className="px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold hover:border-[#7955E8]"
            >
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Session Sign Out */}
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm">Active Session</h3>
          <p className="text-xs text-[#777789] mt-0.5">
            Sign out of your NEXUS AI workspace on this browser.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] text-[#DC2626] dark:text-[#FCA5A5] text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function HelpCentrePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-xs font-semibold text-[#7955E8] mb-1">Guides & Support</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
          NEXUS AI Help Centre
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/app/discover"
          className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5 hover:border-[#7955E8]/50 transition-colors"
        >
          <Compass className="w-5 h-5 text-[#7955E8] mb-3" />
          <h2 className="font-display font-bold text-sm">01. Problem Discovery</h2>
          <p className="text-xs text-[#777789] mt-1.5 leading-relaxed">
            Turn raw observations into structured root causes, stakeholder lists, and research questions.
          </p>
        </Link>
        <Link
          to="/app/studio"
          className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5 hover:border-[#7955E8]/50 transition-colors"
        >
          <Sparkles className="w-5 h-5 text-[#63CBEA] mb-3" />
          <h2 className="font-display font-bold text-sm">02. AI Studio Tools</h2>
          <p className="text-xs text-[#777789] mt-1.5 leading-relaxed">
            Run feasibility checks, tech stack recommendations, and contextual project Q&A.
          </p>
        </Link>
        <Link
          to="/app/reports"
          className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5 hover:border-[#7955E8]/50 transition-colors"
        >
          <FileText className="w-5 h-5 text-[#FF895E] mb-3" />
          <h2 className="font-display font-bold text-sm">03. Pitch & PDF Export</h2>
          <p className="text-xs text-[#777789] mt-1.5 leading-relaxed">
            Draft formal reports and 9-section hackathon pitches and download clean PDF briefs.
          </p>
        </Link>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#7955E8]" />
          <h2 className="font-display font-bold text-base">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-[#ECECF2] dark:divide-[#23263A] text-sm">
          <div className="py-3">
            <p className="font-semibold">How are AI complexity and impact ratings calculated?</p>
            <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1 leading-relaxed">
              They are qualitative AI estimates generated from your project description and domain constraints to help compare tradeoffs—always verify timelines and hardware bills of materials independently.
            </p>
          </div>
          <div className="py-3">
            <p className="font-semibold">Can teammates edit shared projects?</p>
            <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1 leading-relaxed">
              Yes. Link a project to a Team in Collaborate and invite teammates by email. All changes save to the server database.
            </p>
          </div>
          <div className="py-3">
            <p className="font-semibold">How is project completion percentage computed?</p>
            <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1 leading-relaxed">
              When tasks exist on a project, completion automatically reflects Todo, In Progress, and Done task states.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
