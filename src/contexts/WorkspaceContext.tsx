import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';
import type {
  ActivityLog,
  AppNotification,
  GeneratedReport,
  Project,
  ProjectComment,
  ProjectTask,
  Team,
  User,
  UserRole,
} from '../types/nexus';
import { useTheme } from './ThemeContext';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}

interface WorkspaceContextValue {
  user: User | null;
  authLoading: boolean;
  workspaceLoading: boolean;
  projects: Project[];
  tasks: ProjectTask[];
  teams: Team[];
  comments: ProjectComment[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  reports: GeneratedReport[];
  toasts: ToastMessage[];
  pushToast: (title: string, variant?: ToastMessage['variant'], description?: string) => void;
  dismissToast: (id: string) => void;
  refreshWorkspace: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    institution?: string;
    role?: UserRole;
  }) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setComments: React.Dispatch<React.SetStateAction<ProjectComment[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setReports: React.Dispatch<React.SetStateAction<GeneratedReport[]>>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, variant: ToastMessage['variant'] = 'info', description?: string) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const refreshWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    try {
      const data = await api.getWorkspace();
      setUser(data.user);
      setProjects(data.projects);
      setTasks(data.tasks);
      setTeams(data.teams);
      setComments(data.comments);
      setNotifications(data.notifications);
      setActivityLogs(data.activityLogs);
      setReports(data.reports);
      if (data.user.themePreference) {
        setTheme(data.user.themePreference);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const token = getAuthToken();
      if (!token) {
        try {
          const res = await api.me();
          if (active && res.user) {
            setUser(res.user);
            await refreshWorkspace();
          }
        } catch {
          // Not authenticated yet
        } finally {
          if (active) setAuthLoading(false);
        }
        return;
      }
      try {
        const res = await api.me();
        if (active && res.user) {
          setUser(res.user);
          await refreshWorkspace();
        }
      } catch {
        setAuthToken(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, [refreshWorkspace]);

  const login = async (email: string, password: string, remember = true) => {
    const res = await api.login({ email, password, remember });
    setAuthToken(res.token);
    setUser(res.user);
    await refreshWorkspace();
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    institution?: string;
    role?: UserRole;
  }) => {
    const res = await api.register(payload);
    setAuthToken(res.token);
    setUser(res.user);
    await refreshWorkspace();
  };

  const loginDemo = async () => {
    const res = await api.loginDemo();
    setAuthToken(res.token);
    setUser(res.user);
    await refreshWorkspace();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setTeams([]);
    setComments([]);
    setNotifications([]);
    setActivityLogs([]);
    setReports([]);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        authLoading,
        workspaceLoading,
        projects,
        tasks,
        teams,
        comments,
        notifications,
        activityLogs,
        reports,
        toasts,
        pushToast,
        dismissToast,
        refreshWorkspace,
        login,
        register,
        loginDemo,
        logout,
        setUser,
        setProjects,
        setTasks,
        setTeams,
        setComments,
        setNotifications,
        setReports,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
