import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, FolderKanban, Layers, ListChecks } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';

const PIE_COLORS = ['#7955E8', '#63CBEA', '#FF895E', '#F47BA7', '#2EA87E', '#E5953B'];

export default function AnalyticsPage() {
  const { projects, tasks, activityLogs } = useWorkspace();
  const navigate = useNavigate();

  const visibleProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const metrics = useMemo(() => {
    const total = visibleProjects.length;
    const active = visibleProjects.filter((p) => p.status === 'In Progress').length;
    const completed = visibleProjects.filter((p) => p.status === 'Completed').length;
    const doneTasks = tasks.filter((t) => t.status === 'Done').length;
    const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    return { total, active, completed, completionRate, totalTasks: tasks.length, doneTasks };
  }, [visibleProjects, tasks]);

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of visibleProjects) {
      counts.set(p.domain, (counts.get(p.domain) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([domain, count]) => ({ domain, count }));
  }, [visibleProjects]);

  const statusBreakdown = useMemo(() => {
    return [
      { name: 'Planning', value: visibleProjects.filter((p) => p.status === 'Planning').length },
      { name: 'In Progress', value: visibleProjects.filter((p) => p.status === 'In Progress').length },
      { name: 'Completed', value: visibleProjects.filter((p) => p.status === 'Completed').length },
    ].filter((s) => s.value > 0);
  }, [visibleProjects]);

  const weeklyActivity = useMemo(() => {
    const days: Array<{ day: string; events: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      const isoPrefix = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const count = activityLogs.filter((a) => a.createdAt.startsWith(isoPrefix)).length;
      days.push({ day: label, events: count });
    }
    return days;
  }, [activityLogs]);

  const progressBars = useMemo(() => {
    return visibleProjects.map((p) => ({
      name: p.title.length > 20 ? `${p.title.slice(0, 19)}…` : p.title,
      progress: p.progress,
    }));
  }, [visibleProjects]);

  if (visibleProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-[#7955E8] mb-1">Workspace Metrics</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">Analytics</h1>
        </div>
        <EmptyState
          icon={BarChart3}
          title="Insufficient project data"
          description="Create at least one innovation project and add tasks to unlock domain breakdowns, completion charts, and weekly activity insights."
          actionLabel="Create Project"
          onAction={() => navigate('/app/projects')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#7955E8] mb-1">Real-Data Metrics</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
          Innovation Analytics
        </h1>
        <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">
          Live metrics computed directly from your saved projects, tasks, and workspace logs.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-xs text-[#777789]">
            <span>Total Projects</span>
            <FolderKanban className="w-4 h-4 text-[#7955E8]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3">{metrics.total}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-xs text-[#777789]">
            <span>Active Projects</span>
            <Layers className="w-4 h-4 text-[#63CBEA]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3">{metrics.active}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-xs text-[#777789]">
            <span>Completed Projects</span>
            <CheckCircle2 className="w-4 h-4 text-[#2EA87E]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3">{metrics.completed}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-5">
          <div className="flex items-center justify-between text-xs text-[#777789]">
            <span>Task Completion</span>
            <ListChecks className="w-4 h-4 text-[#FF895E]" />
          </div>
          <p className="font-display font-bold text-3xl tabular-nums mt-3">
            {metrics.completionRate}%
          </p>
          <p className="text-[11px] text-[#777789] mt-1 font-mono tabular-nums">
            {metrics.doneTasks}/{metrics.totalTasks} tasks done
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
          <h2 className="font-display font-bold text-base mb-1">Projects by Category</h2>
          <p className="text-xs text-[#777789] mb-4">Distribution across innovation domains</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECECF2" vertical={false} />
                <XAxis dataKey="domain" tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171725',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Projects" fill="#7955E8" radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
          <h2 className="font-display font-bold text-base mb-1">Weekly Workspace Activity</h2>
          <p className="text-xs text-[#777789] mb-4">Logged actions over the last 7 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECECF2" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171725',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Actions"
                  stroke="#63CBEA"
                  strokeWidth={2.5}
                  fill="#63CBEA"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
          <h2 className="font-display font-bold text-base mb-1">Progress by Project</h2>
          <p className="text-xs text-[#777789] mb-4">Current completion percentage</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressBars} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECECF2" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#777789' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171725',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="progress" name="Progress (%)" fill="#FF895E" radius={[0, 8, 8, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6">
          <h2 className="font-display font-bold text-base mb-1">Status Distribution</h2>
          <p className="text-xs text-[#777789] mb-4">Planning vs In Progress vs Completed</p>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full sm:w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    {statusBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171725',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {statusBreakdown.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span>{item.name}:</span>
                  <span className="font-mono tabular-nums font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
