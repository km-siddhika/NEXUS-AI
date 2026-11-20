import React, { useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';
import { ProjectFormModal } from '../components/UiPrimitives';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/discover', label: 'Discover', icon: Compass },
  { to: '/app/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/app/studio', label: 'AI Studio', icon: Sparkles },
  { to: '/app/collaborate', label: 'Collaborate', icon: Users },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, projects, notifications, setNotifications, setUser, logout, pushToast } =
    useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return projects
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [projects, searchQuery]);

  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    if (path === '/app') return 'Overview';
    if (path.startsWith('/app/discover')) return 'Discover Problems';
    if (path.startsWith('/app/projects/')) {
      const id = path.split('/')[3];
      const match = projects.find((p) => p.id === id);
      return match ? `My Projects / ${match.title}` : 'My Projects / Workspace';
    }
    if (path.startsWith('/app/projects')) return 'My Projects';
    if (path.startsWith('/app/studio')) return 'AI Studio';
    if (path.startsWith('/app/collaborate')) return 'Collaboration';
    if (path.startsWith('/app/analytics')) return 'Analytics';
    if (path.startsWith('/app/reports')) return 'Reports & Pitch Builder';
    if (path.startsWith('/app/settings')) return 'Settings';
    if (path.startsWith('/app/help')) return 'Help Centre';
    return 'Workspace';
  }, [location.pathname, projects]);

  const handleToggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    try {
      const res = await api.updateProfile({ themePreference: next });
      setUser(res.user);
    } catch {
      // local theme still updates immediately
    }
  };

  const handleMarkRead = async (id: string, link?: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
    if (link) {
      setNotifOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    pushToast('Signed out', 'info');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F8F8FC] dark:bg-[#0D0E14] text-[#171725] dark:text-[#F4F4FA]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white dark:bg-[#151722] border-r border-[#ECECF2] dark:border-[#23263A] transition-[width] duration-200 sticky top-0 h-screen z-30 ${
          collapsed ? 'w-[78px]' : 'w-[256px]'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#ECECF2] dark:border-[#23263A]">
          <Link
            to="/app"
            className="focus-visible:outline-2 focus-visible:outline-[#7955E8] rounded-lg"
            title="NEXUS AI Overview"
          >
            <NexusLogo size="md" showWordmark={!collapsed} />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors focus-visible:outline-2 focus-visible:outline-[#7955E8]"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Workspace">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF]'
                      : 'text-[#777789] dark:text-[#9C9DB2] hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] hover:text-[#171725] dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[#ECECF2] dark:border-[#23263A] space-y-1">
          <NavLink
            to="/app/help"
            title="Help Centre"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF]'
                  : 'text-[#777789] dark:text-[#9C9DB2] hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] hover:text-[#171725] dark:hover:text-white'
              }`
            }
          >
            <HelpCircle className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Help Centre</span>}
          </NavLink>

          <Link
            to="/app/settings"
            title="Profile & Settings"
            className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: user?.avatarColor || '#7955E8' }}
            >
              {user?.avatarInitials || 'NX'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-[#777789] dark:text-[#9C9DB2] truncate">
                  {user?.role}
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#777789] dark:text-[#9C9DB2] hover:bg-[#FEF2F2] dark:hover:bg-[#3A1C1E] hover:text-[#DC2626] dark:hover:text-[#FCA5A5] transition-colors whitespace-nowrap"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#171725]/45"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-[#151722] h-full flex flex-col border-r border-[#ECECF2] dark:border-[#23263A]">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#ECECF2] dark:border-[#23263A]">
              <NexusLogo size="md" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                title="Close menu"
                className="p-2 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF]'
                          : 'text-[#777789] dark:text-[#9C9DB2]'
                      }`
                    }
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              <NavLink
                to="/app/help"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#EEE8FF] dark:bg-[#251E42] text-[#7955E8] dark:text-[#C5B3FF]'
                      : 'text-[#777789] dark:text-[#9C9DB2]'
                  }`
                }
              >
                <HelpCircle className="w-[18px] h-[18px]" />
                <span>Help Centre</span>
              </NavLink>
            </nav>
            <div className="p-3 border-t border-[#ECECF2] dark:border-[#23263A]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#DC2626]"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 sticky top-0 z-20 bg-white/95 dark:bg-[#151722]/95 backdrop-blur border-b border-[#ECECF2] dark:border-[#23263A] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              title="Open menu"
              className="lg:hidden p-2 rounded-lg text-[#777789] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-[#777789] dark:text-[#9C9DB2] truncate">
              <span className="text-[#171725] dark:text-[#F4F4FA] font-semibold">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Interactive Search */}
            <div className="relative hidden md:block w-56 lg:w-72">
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                aria-label="Focus workspace search"
                title="Search projects"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777789] hover:text-[#171725] dark:hover:text-white"
              >
                <Search className="w-4 h-4" />
              </button>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults[0]) {
                    navigate(`/app/projects/${searchResults[0].id}`);
                    setSearchQuery('');
                  }
                }}
                placeholder="Search projects..."
                aria-label="Search projects"
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] pl-9 pr-3 py-1.5 text-sm text-[#171725] dark:text-[#F4F4FA] placeholder:text-[#777789] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/35 focus:border-[#7955E8]"
              />
              {searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#1A1C2A] border border-[#ECECF2] dark:border-[#2A2E45] shadow-lg py-1.5 z-40">
                  {searchResults.length === 0 ? (
                    <div className="px-3.5 py-2 text-xs text-[#777789]">No matching projects</div>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => {
                          navigate(`/app/projects/${p.id}`);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] truncate">
                          {p.title}
                        </span>
                        <span className="text-[11px] text-[#777789] shrink-0">{p.domain}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Open notifications"
                title="Notifications"
                className="relative p-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-[#777789] dark:text-[#9C9DB2] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors focus-visible:outline-2 focus-visible:outline-[#7955E8]"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-md bg-[#7955E8] text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white dark:bg-[#1A1C2A] border border-[#ECECF2] dark:border-[#2A2E45] shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#ECECF2] dark:border-[#23263A] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171725] dark:text-[#F4F4FA]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7955E8] hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#ECECF2] dark:divide-[#23263A]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-[#777789] text-center">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleMarkRead(n.id, n.link)}
                          className={`w-full text-left px-4 py-3 hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] transition-colors ${
                            !n.read ? 'bg-[#EEE8FF]/40 dark:bg-[#251E42]/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4FA]">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="text-[10px] font-medium text-[#7955E8]">New</span>
                            )}
                          </div>
                          <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Switch */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="p-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-[#777789] dark:text-[#9C9DB2] hover:text-[#171725] dark:hover:text-white hover:bg-[#F8F8FC] dark:hover:bg-[#1C1F2E] transition-colors focus-visible:outline-2 focus-visible:outline-[#7955E8]"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                aria-label="Open profile menu"
                title="Account menu"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 focus-visible:outline-2 focus-visible:outline-[#7955E8]"
                style={{ backgroundColor: user?.avatarColor || '#7955E8' }}
              >
                {user?.avatarInitials || 'NX'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#1A1C2A] border border-[#ECECF2] dark:border-[#2A2E45] shadow-xl z-40 py-2">
                  <div className="px-4 py-2 border-b border-[#ECECF2] dark:border-[#23263A]">
                    <p className="text-xs font-bold text-[#171725] dark:text-[#F4F4FA] truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-[#777789] dark:text-[#9C9DB2] truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/app/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#171725] dark:text-[#F4F4FA] hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#777789]" />
                    <span>Settings & Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/app/help');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#171725] dark:text-[#F4F4FA] hover:bg-[#F8F8FC] dark:hover:bg-[#23263A] flex items-center gap-2"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#777789]" />
                    <span>Help Centre</span>
                  </button>
                  <div className="my-1 border-t border-[#ECECF2] dark:border-[#23263A]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#3A1C1E] flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#7955E8]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Project</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ProjectFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(proj) => navigate(`/app/projects/${proj.id}`)}
      />
    </div>
  );
}
