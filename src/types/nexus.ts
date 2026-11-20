export type ProjectDomain =
  | 'Education'
  | 'Healthcare'
  | 'Agriculture'
  | 'Environment'
  | 'Transportation'
  | 'Technology'
  | 'Accessibility'
  | 'Community Development';

export const PROJECT_DOMAINS: ProjectDomain[] = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Environment',
  'Transportation',
  'Technology',
  'Accessibility',
  'Community Development',
];

export type ProjectStatus = 'Planning' | 'In Progress' | 'Completed';
export type ProjectCoverTheme = 'lavender' | 'coral' | 'cyan' | 'rose' | 'mint' | 'amber';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type UserRole = 'Student' | 'Developer' | 'Researcher' | 'Innovator' | 'Hackathon Lead';
export type TeamRole = 'Lead' | 'Researcher' | 'Engineer' | 'Designer';

export interface User {
  id: string;
  name: string;
  email: string;
  institution: string;
  role: UserRole;
  avatarColor: string;
  avatarInitials: string;
  themePreference: 'light' | 'dark';
  notificationsEnabled: boolean;
  aiDepthPreference: 'concise' | 'balanced' | 'comprehensive';
  isDemo?: boolean;
  createdAt: string;
}

export interface ProblemAnalysis {
  summary: string;
  refinedStatement: string;
  rootCauses: string[];
  stakeholders: string[];
  currentChallenges: string[];
  possibleImpact: string[];
  researchQuestions: string[];
  missingInformation: string[];
  opportunities: string[];
  updatedAt: string;
}

export interface SolutionOption {
  id: string;
  name: string;
  shortDescription: string;
  workingPrinciple: string;
  requiredTechnologies: string[];
  estimatedComplexity: 'Low' | 'Medium' | 'High';
  potentialImpact: 'Moderate' | 'High' | 'Transformative';
  advantages: string[];
  limitations: string[];
  risks: string[];
  isEstimate: true;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  duration: string;
  objective: string;
  milestones: string[];
  dependencies: string[];
  testingRequirements: string[];
  deliverables: string[];
}

export interface PitchDeckData {
  projectTitle: string;
  problemStatement: string;
  existingLimitations: string;
  proposedSolution: string;
  innovation: string;
  technologyStack: string;
  implementationPlan: string;
  expectedImpact: string;
  futureScope: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  teamId?: string;
  title: string;
  domain: ProjectDomain;
  status: ProjectStatus;
  archived: boolean;
  bookmarked?: boolean;
  description: string;
  targetAudience: string;
  supportingInfo?: string;
  coverTheme: ProjectCoverTheme;
  progress: number;
  selectedSolutionId?: string;
  problemAnalysis?: ProblemAnalysis;
  solutions?: SolutionOption[];
  roadmapPhases?: RoadmapPhase[];
  pitch?: PitchDeckData;
  aiNotes?: {
    feasibility?: string;
    techStack?: string;
    rootCauseDeepDive?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  ownerId: string;
  phaseId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'Active' | 'Pending';
  joinedAt: string;
}

export interface Team {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  members: TeamMember[];
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  teamId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'project' | 'ai' | 'team' | 'task';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string;
  action: string;
  entityTitle: string;
  category: 'project' | 'ai' | 'task' | 'team' | 'report';
  createdAt: string;
}

export type ReportType =
  | 'Problem Analysis Report'
  | 'Innovation Proposal'
  | 'Technical Project Report'
  | 'Project Roadmap'
  | 'Hackathon Presentation Outline'
  | 'Executive Summary';

export interface GeneratedReport {
  id: string;
  userId: string;
  projectId?: string;
  projectTitle: string;
  reportType: ReportType;
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  createdAt: string;
}

export interface WorkspaceSnapshot {
  user: User;
  projects: Project[];
  tasks: ProjectTask[];
  teams: Team[];
  comments: ProjectComment[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  reports: GeneratedReport[];
}

export type StudioToolId =
  | 'problem_analyzer'
  | 'solution_generator'
  | 'root_cause'
  | 'feasibility'
  | 'roadmap_generator'
  | 'tech_stack'
  | 'pitch_assistant'
  | 'project_chat';
