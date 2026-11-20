import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createId,
  createUserRecord,
  getInitials,
  hashPassword,
  readDb,
  seedDemoWorkspaceForUser,
  toPublicUser,
  verifyPassword,
  writeDb,
} from './server/db.ts';
import {
  analyzeProblemWithGemini,
  generateComparisonSolutions,
  generateDocumentReportWithGemini,
  generatePitchDeckWithGemini,
  generateRoadmapWithGemini,
  runStudioToolWithGemini,
} from './server/gemini.ts';
import type {
  Project,
  ProjectCoverTheme,
  ProjectDomain,
  ProjectStatus,
  ProjectTask,
  ReportType,
  StudioToolId,
  TaskPriority,
  TaskStatus,
  TeamRole,
  UserRole,
} from './src/types/nexus.ts';

interface AuthedRequest extends Request {
  userId?: string;
}

const SESSION_COOKIE = 'nexus_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const PORT = 3000;

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] ?? null;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const db = readDb();
  const now = Date.now();
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt).getTime() > now
  );
  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }
  req.userId = user.id;
  next();
}

function issueSession(userId: string, res: Response, remember = true): string {
  const db = readDb();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  db.sessions.push({
    token,
    userId,
    expiresAt: new Date(now + (remember ? SESSION_TTL_MS : 1000 * 60 * 60 * 12)).toISOString(),
  });
  writeDb(db);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? SESSION_TTL_MS : undefined,
  });
  return token;
}

function getAccessibleProjectIds(db: ReturnType<typeof readDb>, userId: string): Set<string> {
  const user = db.users.find((u) => u.id === userId);
  const ids = new Set<string>();
  for (const p of db.projects) {
    if (p.ownerId === userId) ids.add(p.id);
  }
  if (user) {
    for (const t of db.teams) {
      const isMember =
        t.ownerId === userId ||
        t.members.some((m) => m.email.toLowerCase() === user.email.toLowerCase() || m.id === userId);
      if (isMember) {
        for (const pid of t.projectIds) ids.add(pid);
      }
    }
  }
  return ids;
}

function logActivity(
  db: ReturnType<typeof readDb>,
  userId: string,
  action: string,
  entityTitle: string,
  category: 'project' | 'ai' | 'task' | 'team' | 'report',
  projectId?: string
) {
  db.activityLogs.unshift({
    id: createId('act'),
    userId,
    projectId,
    action,
    entityTitle,
    category,
    createdAt: new Date().toISOString(),
  });
  db.activityLogs = db.activityLogs.slice(0, 150);
}

function addNotification(
  db: ReturnType<typeof readDb>,
  userId: string,
  title: string,
  message: string,
  type: 'project' | 'ai' | 'team' | 'task',
  link?: string
) {
  db.notifications.unshift({
    id: createId('notif'),
    userId,
    title,
    message,
    type,
    read: false,
    link,
    createdAt: new Date().toISOString(),
  });
  db.notifications = db.notifications.slice(0, 80);
}

function computeProjectProgress(tasks: ProjectTask[], project: Project): number {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  if (projTasks.length === 0) {
    if (project.status === 'Completed') return 100;
    return project.progress ?? 15;
  }
  const done = projTasks.filter((t) => t.status === 'Done').length;
  const inProg = projTasks.filter((t) => t.status === 'In Progress').length;
  return Math.min(100, Math.round(((done + inProg * 0.5) / projTasks.length) * 100));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ==================== AUTH ROUTES ====================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, institution, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      institution?: string;
      role?: UserRole;
    };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = readDb();
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user = createUserRecord({
      name,
      email: normalizedEmail,
      password,
      institution,
      role: role ?? 'Innovator',
    });
    db.users.push(user);
    addNotification(
      db,
      user.id,
      'Welcome to NEXUS AI',
      'Start by framing a real-world problem in Discover or creating your first project.',
      'project',
      '/app/discover'
    );
    writeDb(db);

    const token = issueSession(user.id, res, true);
    res.status(201).json({ user: toPublicUser(user), token });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, remember } = req.body as {
      email?: string;
      password?: string;
      remember?: boolean;
    };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const db = readDb();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = issueSession(user.id, res, remember !== false);
    res.json({ user: toPublicUser(user), token });
  });

  app.post('/api/auth/demo', (_req: Request, res: Response) => {
    const db = readDb();
    const demoEmail = 'judge@nexus-demo.ai';
    let demoUser = db.users.find((u) => u.email === demoEmail);
    if (!demoUser) {
      demoUser = createUserRecord({
        name: 'Alex Rivera',
        email: demoEmail,
        password: crypto.randomBytes(16).toString('hex'),
        institution: 'NEXUS Innovation Lab',
        role: 'Hackathon Lead',
        isDemo: true,
      });
      db.users.push(demoUser);
      seedDemoWorkspaceForUser(db, demoUser);
      writeDb(db);
    }
    const token = issueSession(demoUser.id, res, true);
    res.json({ user: toPublicUser(demoUser), token });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    if (!email || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Valid email and new password (min 6 chars) are required.' });
      return;
    }
    const db = readDb();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'No account found with that email address.' });
      return;
    }
    if (user.isDemo) {
      res.status(403).json({ error: 'Demo judge account password cannot be altered.' });
      return;
    }
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    writeDb(db);
    res.json({ ok: true });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (token) {
      const db = readDb();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDb(db);
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  });

  // ==================== WORKSPACE SNAPSHOT ====================
  app.get('/api/workspace', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId)!;
    const accessibleIds = getAccessibleProjectIds(db, user.id);

    const projects = db.projects.filter((p) => accessibleIds.has(p.id));
    const tasks = db.tasks.filter((t) => accessibleIds.has(t.projectId));
    const teams = db.teams.filter(
      (t) =>
        t.ownerId === user.id ||
        t.members.some((m) => m.email.toLowerCase() === user.email.toLowerCase() || m.id === user.id)
    );
    const comments = db.comments.filter((c) => accessibleIds.has(c.projectId));
    const notifications = db.notifications.filter((n) => n.userId === user.id);
    const activityLogs = db.activityLogs.filter(
      (a) => a.userId === user.id || (a.projectId && accessibleIds.has(a.projectId))
    );
    const reports = db.reports.filter((r) => r.userId === user.id);

    res.json({
      user: toPublicUser(user),
      projects,
      tasks,
      teams,
      comments,
      notifications,
      activityLogs,
      reports,
    });
  });

  // ==================== USER PROFILE & SETTINGS ====================
  app.patch('/api/user/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const {
      name,
      institution,
      role,
      avatarColor,
      themePreference,
      notificationsEnabled,
      aiDepthPreference,
    } = req.body as Partial<typeof user>;

    if (typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
      user.avatarInitials = getInitials(user.name);
    }
    if (typeof institution === 'string') user.institution = institution.trim();
    if (role) user.role = role;
    if (typeof avatarColor === 'string') user.avatarColor = avatarColor;
    if (themePreference === 'light' || themePreference === 'dark') {
      user.themePreference = themePreference;
    }
    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }
    if (
      aiDepthPreference === 'concise' ||
      aiDepthPreference === 'balanced' ||
      aiDepthPreference === 'comprehensive'
    ) {
      user.aiDepthPreference = aiDepthPreference;
    }

    writeDb(db);
    res.json({ user: toPublicUser(user) });
  });

  app.patch('/api/user/password', requireAuth, (req: AuthedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.isDemo) {
      res.status(403).json({ error: 'Demo account password cannot be changed.' });
      return;
    }
    if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    writeDb(db);
    res.json({ ok: true });
  });

  // ==================== PROJECTS CRUD ====================
  app.post('/api/projects', requireAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<Project>;
    if (!body.title || body.title.trim().length < 2) {
      res.status(400).json({ error: 'Project title is required.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    const themes: ProjectCoverTheme[] = ['lavender', 'coral', 'cyan', 'rose', 'mint', 'amber'];
    const project: Project = {
      id: createId('proj'),
      ownerId: req.userId!,
      teamId: body.teamId,
      title: body.title.trim(),
      domain: (body.domain as ProjectDomain) || 'Technology',
      status: (body.status as ProjectStatus) || 'Planning',
      archived: false,
      bookmarked: Boolean(body.bookmarked),
      description: (body.description ?? '').trim(),
      targetAudience: (body.targetAudience ?? '').trim(),
      supportingInfo: body.supportingInfo?.trim(),
      coverTheme: body.coverTheme || themes[db.projects.length % themes.length],
      progress: typeof body.progress === 'number' ? body.progress : 15,
      problemAnalysis: body.problemAnalysis,
      solutions: body.solutions,
      selectedSolutionId: body.selectedSolutionId,
      roadmapPhases: body.roadmapPhases,
      pitch: body.pitch,
      aiNotes: body.aiNotes,
      createdAt: now,
      updatedAt: now,
    };

    db.projects.unshift(project);
    logActivity(db, req.userId!, 'Created project', project.title, 'project', project.id);
    addNotification(
      db,
      req.userId!,
      'Project created',
      `"${project.title}" is ready in your workspace.`,
      'project',
      `/app/projects/${project.id}`
    );
    writeDb(db);
    res.status(201).json({ project });
  });

  app.patch('/api/projects/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    const project = db.projects.find((p) => p.id === req.params.id && accessibleIds.has(p.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied.' });
      return;
    }

    const patch = req.body as Partial<Project>;
    if (typeof patch.title === 'string' && patch.title.trim()) project.title = patch.title.trim();
    if (patch.domain) project.domain = patch.domain;
    if (patch.status) project.status = patch.status;
    if (typeof patch.archived === 'boolean') project.archived = patch.archived;
    if (typeof patch.bookmarked === 'boolean') project.bookmarked = patch.bookmarked;
    if (typeof patch.description === 'string') project.description = patch.description.trim();
    if (typeof patch.targetAudience === 'string') project.targetAudience = patch.targetAudience.trim();
    if (typeof patch.supportingInfo === 'string') project.supportingInfo = patch.supportingInfo.trim();
    if (patch.coverTheme) project.coverTheme = patch.coverTheme;
    if (typeof patch.progress === 'number') project.progress = Math.max(0, Math.min(100, patch.progress));
    if (patch.selectedSolutionId !== undefined) project.selectedSolutionId = patch.selectedSolutionId;
    if (patch.problemAnalysis !== undefined) project.problemAnalysis = patch.problemAnalysis;
    if (patch.solutions !== undefined) project.solutions = patch.solutions;
    if (patch.roadmapPhases !== undefined) project.roadmapPhases = patch.roadmapPhases;
    if (patch.pitch !== undefined) project.pitch = patch.pitch;
    if (patch.aiNotes !== undefined) {
      project.aiNotes = { ...(project.aiNotes ?? {}), ...patch.aiNotes };
    }
    if (patch.teamId !== undefined) project.teamId = patch.teamId;

    if (project.status === 'Completed') {
      project.progress = 100;
    }

    project.updatedAt = new Date().toISOString();
    logActivity(db, req.userId!, 'Updated project', project.title, 'project', project.id);
    writeDb(db);
    res.json({ project });
  });

  app.post('/api/projects/:id/duplicate', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    const orig = db.projects.find((p) => p.id === req.params.id && accessibleIds.has(p.id));
    if (!orig) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const now = new Date().toISOString();
    const copy: Project = {
      ...structuredClone(orig),
      id: createId('proj'),
      ownerId: req.userId!,
      title: `${orig.title} (Copy)`,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.unshift(copy);
    logActivity(db, req.userId!, 'Duplicated project', copy.title, 'project', copy.id);
    writeDb(db);
    res.status(201).json({ project: copy });
  });

  app.delete('/api/projects/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const project = db.projects.find((p) => p.id === req.params.id && p.ownerId === req.userId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or only the owner can delete it.' });
      return;
    }
    db.projects = db.projects.filter((p) => p.id !== project.id);
    db.tasks = db.tasks.filter((t) => t.projectId !== project.id);
    db.comments = db.comments.filter((c) => c.projectId !== project.id);
    for (const t of db.teams) {
      t.projectIds = t.projectIds.filter((pid) => pid !== project.id);
    }
    logActivity(db, req.userId!, 'Deleted project', project.title, 'project');
    writeDb(db);
    res.json({ ok: true });
  });

  // ==================== TASKS CRUD ====================
  app.post('/api/tasks', requireAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body as {
      projectId?: string;
      phaseId?: string;
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      deadline?: string;
      assigneeName?: string;
    };
    if (!body.projectId || !body.title?.trim()) {
      res.status(400).json({ error: 'Project ID and task title are required.' });
      return;
    }
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    const project = db.projects.find((p) => p.id === body.projectId && accessibleIds.has(p.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const now = new Date().toISOString();
    const task: ProjectTask = {
      id: createId('task'),
      projectId: project.id,
      ownerId: req.userId!,
      phaseId: body.phaseId,
      title: body.title.trim(),
      description: (body.description ?? '').trim(),
      status: body.status ?? 'Todo',
      priority: body.priority ?? 'Medium',
      deadline: body.deadline || new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      assigneeName: body.assigneeName?.trim(),
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.unshift(task);
    project.progress = computeProjectProgress(db.tasks, project);
    project.updatedAt = now;
    logActivity(db, req.userId!, 'Added task', task.title, 'task', project.id);
    writeDb(db);
    res.status(201).json({ task, projectProgress: project.progress });
  });

  app.patch('/api/tasks/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    const task = db.tasks.find((t) => t.id === req.params.id && accessibleIds.has(t.projectId));
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    const patch = req.body as Partial<ProjectTask>;
    if (typeof patch.title === 'string' && patch.title.trim()) task.title = patch.title.trim();
    if (typeof patch.description === 'string') task.description = patch.description.trim();
    if (patch.status) task.status = patch.status;
    if (patch.priority) task.priority = patch.priority;
    if (typeof patch.deadline === 'string') task.deadline = patch.deadline;
    if (typeof patch.assigneeName === 'string') task.assigneeName = patch.assigneeName.trim();
    if (patch.phaseId !== undefined) task.phaseId = patch.phaseId;
    task.updatedAt = new Date().toISOString();

    const project = db.projects.find((p) => p.id === task.projectId);
    let projectProgress = project?.progress ?? 0;
    if (project) {
      project.progress = computeProjectProgress(db.tasks, project);
      project.updatedAt = task.updatedAt;
      projectProgress = project.progress;
    }
    if (patch.status === 'Done') {
      logActivity(db, req.userId!, 'Completed task', task.title, 'task', task.projectId);
    }
    writeDb(db);
    res.json({ task, projectProgress });
  });

  app.delete('/api/tasks/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    const task = db.tasks.find((t) => t.id === req.params.id && accessibleIds.has(t.projectId));
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    db.tasks = db.tasks.filter((t) => t.id !== task.id);
    const project = db.projects.find((p) => p.id === task.projectId);
    let projectProgress = 0;
    if (project) {
      project.progress = computeProjectProgress(db.tasks, project);
      project.updatedAt = new Date().toISOString();
      projectProgress = project.progress;
    }
    writeDb(db);
    res.json({ ok: true, projectProgress });
  });

  // ==================== TEAMS & COLLABORATION ====================
  app.post('/api/teams', requireAuth, (req: AuthedRequest, res: Response) => {
    const { name, description, projectIds } = req.body as {
      name?: string;
      description?: string;
      projectIds?: string[];
    };
    if (!name?.trim()) {
      res.status(400).json({ error: 'Team name is required.' });
      return;
    }
    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId)!;
    const now = new Date().toISOString();
    const teamId = createId('team');
    const team = {
      id: teamId,
      ownerId: user.id,
      name: name.trim(),
      description: (description ?? '').trim(),
      members: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'Lead' as TeamRole,
          status: 'Active' as const,
          joinedAt: now,
        },
      ],
      projectIds: Array.isArray(projectIds) ? projectIds : [],
      createdAt: now,
      updatedAt: now,
    };
    for (const pid of team.projectIds) {
      const p = db.projects.find((proj) => proj.id === pid && proj.ownerId === user.id);
      if (p) p.teamId = teamId;
    }
    db.teams.unshift(team);
    logActivity(db, user.id, 'Created team', team.name, 'team');
    writeDb(db);
    res.status(201).json({ team });
  });

  app.patch('/api/teams/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const team = db.teams.find((t) => t.id === req.params.id && t.ownerId === req.userId);
    if (!team) {
      res.status(404).json({ error: 'Team not found or only team lead can edit settings.' });
      return;
    }
    const { name, description, projectIds } = req.body as {
      name?: string;
      description?: string;
      projectIds?: string[];
    };
    if (typeof name === 'string' && name.trim()) team.name = name.trim();
    if (typeof description === 'string') team.description = description.trim();
    if (Array.isArray(projectIds)) {
      team.projectIds = projectIds;
      for (const p of db.projects) {
        if (p.teamId === team.id && !projectIds.includes(p.id)) {
          p.teamId = undefined;
        } else if (projectIds.includes(p.id) && p.ownerId === req.userId) {
          p.teamId = team.id;
        }
      }
    }
    team.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ team });
  });

  app.post('/api/teams/:id/members', requireAuth, (req: AuthedRequest, res: Response) => {
    const { name, email, role } = req.body as {
      name?: string;
      email?: string;
      role?: TeamRole;
    };
    if (!name?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid member name and email are required.' });
      return;
    }
    const db = readDb();
    const team = db.teams.find((t) => t.id === req.params.id && t.ownerId === req.userId);
    if (!team) {
      res.status(404).json({ error: 'Team not found or only the team lead can invite members.' });
      return;
    }
    const normEmail = email.trim().toLowerCase();
    if (team.members.some((m) => m.email.toLowerCase() === normEmail)) {
      res.status(409).json({ error: 'This member is already in the team.' });
      return;
    }
    const existingAccount = db.users.find((u) => u.email === normEmail);
    const member = {
      id: existingAccount ? existingAccount.id : createId('mem'),
      name: name.trim(),
      email: normEmail,
      role: role ?? 'Researcher',
      status: existingAccount ? ('Active' as const) : ('Pending' as const),
      joinedAt: new Date().toISOString(),
    };
    team.members.push(member);
    team.updatedAt = new Date().toISOString();
    logActivity(db, req.userId!, 'Invited collaborator', `${member.name} (${member.role})`, 'team');
    if (existingAccount) {
      addNotification(
        db,
        existingAccount.id,
        'Added to team',
        `You were added to "${team.name}" as ${member.role}.`,
        'team',
        '/app/collaborate'
      );
    }
    writeDb(db);
    res.status(201).json({ team });
  });

  app.patch('/api/teams/:id/members/:memberId', requireAuth, (req: AuthedRequest, res: Response) => {
    const { role } = req.body as { role?: TeamRole };
    const db = readDb();
    const team = db.teams.find((t) => t.id === req.params.id && t.ownerId === req.userId);
    if (!team) {
      res.status(404).json({ error: 'Team not found or only team lead can change roles.' });
      return;
    }
    const member = team.members.find((m) => m.id === req.params.memberId);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    if (role) member.role = role;
    team.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ team });
  });

  app.delete('/api/teams/:id/members/:memberId', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const team = db.teams.find((t) => t.id === req.params.id && t.ownerId === req.userId);
    if (!team) {
      res.status(404).json({ error: 'Team not found or permission denied.' });
      return;
    }
    if (req.params.memberId === team.ownerId) {
      res.status(400).json({ error: 'Cannot remove the team owner.' });
      return;
    }
    team.members = team.members.filter((m) => m.id !== req.params.memberId);
    team.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ team });
  });

  app.post('/api/comments', requireAuth, (req: AuthedRequest, res: Response) => {
    const { projectId, content } = req.body as { projectId?: string; content?: string };
    if (!projectId || !content?.trim()) {
      res.status(400).json({ error: 'Project ID and comment content are required.' });
      return;
    }
    const db = readDb();
    const accessibleIds = getAccessibleProjectIds(db, req.userId!);
    if (!accessibleIds.has(projectId)) {
      res.status(403).json({ error: 'Access denied to this project.' });
      return;
    }
    const user = db.users.find((u) => u.id === req.userId)!;
    const project = db.projects.find((p) => p.id === projectId);
    const comment = {
      id: createId('cmt'),
      projectId,
      teamId: project?.teamId,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    db.comments.unshift(comment);
    logActivity(db, user.id, 'Posted comment', project?.title || 'Project', 'team', projectId);
    writeDb(db);
    res.status(201).json({ comment });
  });

  // ==================== NOTIFICATIONS ====================
  app.patch('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === req.userId);
    if (notif) {
      notif.read = true;
      writeDb(db);
    }
    res.json({ ok: true });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    for (const n of db.notifications) {
      if (n.userId === req.userId) n.read = true;
    }
    writeDb(db);
    res.json({ ok: true });
  });

  // ==================== GENERATED REPORTS ====================
  app.post('/api/reports', requireAuth, (req: AuthedRequest, res: Response) => {
    const body = req.body as {
      projectId?: string;
      projectTitle?: string;
      reportType?: ReportType;
      title?: string;
      sections?: Array<{ heading: string; content: string }>;
    };
    if (!body.title?.trim() || !Array.isArray(body.sections)) {
      res.status(400).json({ error: 'Report title and sections are required.' });
      return;
    }
    const db = readDb();
    const report = {
      id: createId('rep'),
      userId: req.userId!,
      projectId: body.projectId,
      projectTitle: body.projectTitle || 'Custom Innovation',
      reportType: body.reportType || 'Innovation Proposal',
      title: body.title.trim(),
      sections: body.sections,
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    logActivity(db, req.userId!, 'Saved report', report.title, 'report', body.projectId);
    writeDb(db);
    res.status(201).json({ report });
  });

  app.delete('/api/reports/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    db.reports = db.reports.filter((r) => !(r.id === req.params.id && r.userId === req.userId));
    writeDb(db);
    res.json({ ok: true });
  });

  // ==================== GEMINI AI ROUTES (SERVER-SIDE) ====================
  app.post('/api/ai/discover', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { title, description, domain, targetAudience, supportingInfo } = req.body as {
        title?: string;
        description?: string;
        domain?: string;
        targetAudience?: string;
        supportingInfo?: string;
      };
      if (!title?.trim() || !description?.trim()) {
        res.status(400).json({ error: 'Problem title and detailed description are required.' });
        return;
      }
      const analysis = await analyzeProblemWithGemini({
        title: title.trim(),
        description: description.trim(),
        domain: domain || 'Technology',
        targetAudience: targetAudience || 'General public',
        supportingInfo,
      });

      const db = readDb();
      logActivity(db, req.userId!, 'Analyzed problem with Gemini', title.trim(), 'ai');
      writeDb(db);
      res.json({ analysis });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gemini analysis failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/studio', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { toolId, promptInput, context, projectTitle, domain, history } = req.body as {
        toolId?: StudioToolId;
        promptInput?: string;
        context?: string;
        projectTitle?: string;
        domain?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };
      if (!toolId || !promptInput?.trim()) {
        res.status(400).json({ error: 'Tool selection and input prompt are required.' });
        return;
      }
      const result = await runStudioToolWithGemini({
        toolId,
        promptInput: promptInput.trim(),
        context,
        projectTitle,
        domain,
        history,
      });
      const db = readDb();
      logActivity(
        db,
        req.userId!,
        `Ran AI Studio (${toolId.replace(/_/g, ' ')})`,
        projectTitle || promptInput.slice(0, 48),
        'ai'
      );
      writeDb(db);
      res.json({ result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI Studio generation failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/compare-solutions', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { projectId, title, domain, description, targetAudience, constraints } = req.body as {
        projectId?: string;
        title?: string;
        domain?: string;
        description?: string;
        targetAudience?: string;
        constraints?: string;
      };
      if (!title?.trim() || !description?.trim()) {
        res.status(400).json({ error: 'Project title and description are required.' });
        return;
      }
      const solutions = await generateComparisonSolutions({
        title: title.trim(),
        domain: domain || 'Technology',
        description: description.trim(),
        targetAudience: targetAudience || 'End users',
        constraints,
      });

      const db = readDb();
      if (projectId) {
        const accessibleIds = getAccessibleProjectIds(db, req.userId!);
        const project = db.projects.find((p) => p.id === projectId && accessibleIds.has(p.id));
        if (project) {
          project.solutions = solutions;
          project.updatedAt = new Date().toISOString();
        }
      }
      logActivity(db, req.userId!, 'Generated 3 solution alternatives', title.trim(), 'ai', projectId);
      writeDb(db);
      res.json({ solutions });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Solution comparison failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/roadmap', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { projectId, title, domain, description, selectedSolution, timeframe } = req.body as {
        projectId?: string;
        title?: string;
        domain?: string;
        description?: string;
        selectedSolution?: string;
        timeframe?: string;
      };
      if (!title?.trim() || !description?.trim()) {
        res.status(400).json({ error: 'Project title and description are required.' });
        return;
      }
      const generated = await generateRoadmapWithGemini({
        title: title.trim(),
        domain: domain || 'Technology',
        description: description.trim(),
        selectedSolution,
        timeframe,
      });

      const db = readDb();
      const createdTasks: ProjectTask[] = [];
      if (projectId) {
        const accessibleIds = getAccessibleProjectIds(db, req.userId!);
        const project = db.projects.find((p) => p.id === projectId && accessibleIds.has(p.id));
        if (project) {
          project.roadmapPhases = generated.phases;
          const now = new Date().toISOString();
          for (const st of generated.suggestedTasks) {
            const phase = generated.phases[st.phaseIndex] ?? generated.phases[0];
            const deadline = new Date(
              Date.now() + Math.max(1, st.daysFromNow || 7) * 86400_000
            )
              .toISOString()
              .slice(0, 10);
            const t: ProjectTask = {
              id: createId('task'),
              projectId: project.id,
              ownerId: req.userId!,
              phaseId: phase?.id,
              title: st.title,
              description: st.description,
              status: 'Todo',
              priority: st.priority || 'Medium',
              deadline,
              createdAt: now,
              updatedAt: now,
            };
            db.tasks.unshift(t);
            createdTasks.push(t);
          }
          project.progress = computeProjectProgress(db.tasks, project);
          project.updatedAt = now;
        }
      }
      logActivity(db, req.userId!, 'Generated AI project roadmap', title.trim(), 'ai', projectId);
      writeDb(db);
      res.json({ phases: generated.phases, createdTasks });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Roadmap generation failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/pitch', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { projectId, title, domain, description, targetAudience, selectedSolution } = req.body as {
        projectId?: string;
        title?: string;
        domain?: string;
        description?: string;
        targetAudience?: string;
        selectedSolution?: string;
      };
      if (!title?.trim() || !description?.trim()) {
        res.status(400).json({ error: 'Project title and description are required.' });
        return;
      }
      const pitch = await generatePitchDeckWithGemini({
        title: title.trim(),
        domain: domain || 'Technology',
        description: description.trim(),
        targetAudience: targetAudience || 'End users',
        selectedSolution,
      });

      const db = readDb();
      if (projectId) {
        const accessibleIds = getAccessibleProjectIds(db, req.userId!);
        const project = db.projects.find((p) => p.id === projectId && accessibleIds.has(p.id));
        if (project) {
          project.pitch = pitch;
          project.updatedAt = new Date().toISOString();
        }
      }
      logActivity(db, req.userId!, 'Generated pitch deck', title.trim(), 'ai', projectId);
      writeDb(db);
      res.json({ pitch });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pitch generation failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/report', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { projectId, reportType, projectTitle, domain, description, contextSummary } = req.body as {
        projectId?: string;
        reportType?: ReportType;
        projectTitle?: string;
        domain?: string;
        description?: string;
        contextSummary?: string;
      };
      if (!reportType || !projectTitle?.trim()) {
        res.status(400).json({ error: 'Report type and project title are required.' });
        return;
      }
      const generated = await generateDocumentReportWithGemini({
        reportType,
        projectTitle: projectTitle.trim(),
        domain: domain || 'Technology',
        description: description || projectTitle,
        contextSummary,
      });

      const db = readDb();
      const report = {
        id: createId('rep'),
        userId: req.userId!,
        projectId,
        projectTitle: projectTitle.trim(),
        reportType,
        title: generated.title,
        sections: generated.sections,
        createdAt: new Date().toISOString(),
      };
      db.reports.unshift(report);
      logActivity(db, req.userId!, `Generated ${reportType}`, projectTitle.trim(), 'report', projectId);
      writeDb(db);
      res.json({ report });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Report generation failed';
      res.status(500).json({ error: message });
    }
  });

  // ==================== VITE / STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXUS AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NEXUS AI server:', err);
  process.exit(1);
});
