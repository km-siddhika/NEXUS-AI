import type {
  AppNotification,
  GeneratedReport,
  PitchDeckData,
  ProblemAnalysis,
  Project,
  ProjectComment,
  ProjectTask,
  ReportType,
  RoadmapPhase,
  SolutionOption,
  StudioToolId,
  Team,
  TeamRole,
  User,
  UserRole,
  WorkspaceSnapshot,
} from '../types/nexus';

const TOKEN_KEY = 'nexus_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const errObj = data as { error?: string };
    throw new Error(errObj?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  register: (payload: {
    name: string;
    email: string;
    password: string;
    institution?: string;
    role?: UserRole;
  }) => request<{ user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string; remember?: boolean }) =>
    request<{ user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  loginDemo: () => request<{ user: User; token: string }>('/api/auth/demo', { method: 'POST' }),

  resetPassword: (payload: { email: string; newPassword: string }) =>
    request<{ ok: boolean }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/api/auth/me'),

  // Workspace
  getWorkspace: () => request<WorkspaceSnapshot>('/api/workspace'),

  // User Profile
  updateProfile: (patch: Partial<User>) =>
    request<{ user: User }>('/api/user/profile', { method: 'PATCH', body: JSON.stringify(patch) }),

  updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>('/api/user/password', { method: 'PATCH', body: JSON.stringify(payload) }),

  // Projects
  createProject: (payload: Partial<Project>) =>
    request<{ project: Project }>('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),

  updateProject: (id: string, patch: Partial<Project>) =>
    request<{ project: Project }>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  duplicateProject: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}/duplicate`, { method: 'POST' }),

  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (payload: Partial<ProjectTask> & { projectId: string; title: string }) =>
    request<{ task: ProjectTask; projectProgress: number }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (id: string, patch: Partial<ProjectTask>) =>
    request<{ task: ProjectTask; projectProgress: number }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteTask: (id: string) =>
    request<{ ok: boolean; projectProgress: number }>(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Teams & Comments
  createTeam: (payload: { name: string; description?: string; projectIds?: string[] }) =>
    request<{ team: Team }>('/api/teams', { method: 'POST', body: JSON.stringify(payload) }),

  updateTeam: (id: string, patch: { name?: string; description?: string; projectIds?: string[] }) =>
    request<{ team: Team }>(`/api/teams/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  inviteMember: (teamId: string, payload: { name: string; email: string; role: TeamRole }) =>
    request<{ team: Team }>(`/api/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify(payload) }),

  updateMemberRole: (teamId: string, memberId: string, role: TeamRole) =>
    request<{ team: Team }>(`/api/teams/${teamId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  removeMember: (teamId: string, memberId: string) =>
    request<{ team: Team }>(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),

  addComment: (payload: { projectId: string; content: string }) =>
    request<{ comment: ProjectComment }>('/api/comments', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Reports
  saveReport: (payload: {
    projectId?: string;
    projectTitle?: string;
    reportType: ReportType;
    title: string;
    sections: Array<{ heading: string; content: string }>;
  }) => request<{ report: GeneratedReport }>('/api/reports', { method: 'POST', body: JSON.stringify(payload) }),

  deleteReport: (id: string) =>
    request<{ ok: boolean }>(`/api/reports/${id}`, { method: 'DELETE' }),

  // Gemini AI
  discoverAnalyze: (payload: {
    title: string;
    description: string;
    domain: string;
    targetAudience: string;
    supportingInfo?: string;
  }) => request<{ analysis: ProblemAnalysis }>('/api/ai/discover', { method: 'POST', body: JSON.stringify(payload) }),

  runStudioTool: (payload: {
    toolId: StudioToolId;
    promptInput: string;
    context?: string;
    projectTitle?: string;
    domain?: string;
    history?: Array<{ role: 'user' | 'model'; text: string }>;
  }) =>
    request<{
      result: {
        headline: string;
        summary: string;
        sections: Array<{ title: string; items: string[]; note?: string }>;
        markdownText: string;
      };
    }>('/api/ai/studio', { method: 'POST', body: JSON.stringify(payload) }),

  compareSolutions: (payload: {
    projectId?: string;
    title: string;
    domain: string;
    description: string;
    targetAudience: string;
    constraints?: string;
  }) =>
    request<{ solutions: SolutionOption[] }>('/api/ai/compare-solutions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateRoadmap: (payload: {
    projectId?: string;
    title: string;
    domain: string;
    description: string;
    selectedSolution?: string;
    timeframe?: string;
  }) =>
    request<{ phases: RoadmapPhase[]; createdTasks: ProjectTask[] }>('/api/ai/roadmap', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generatePitch: (payload: {
    projectId?: string;
    title: string;
    domain: string;
    description: string;
    targetAudience: string;
    selectedSolution?: string;
  }) => request<{ pitch: PitchDeckData }>('/api/ai/pitch', { method: 'POST', body: JSON.stringify(payload) }),

  generateReport: (payload: {
    projectId?: string;
    reportType: ReportType;
    projectTitle: string;
    domain: string;
    description: string;
    contextSummary?: string;
  }) => request<{ report: GeneratedReport }>('/api/ai/report', { method: 'POST', body: JSON.stringify(payload) }),
};

export type { AppNotification };
