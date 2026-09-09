import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  fetchProjectSnapshot,
  fetchProjects,
  addProject,
  openArtifactParentFolder,
  subscribeToProject,
  type AddProjectResult,
  type ArtifactOpener,
  type EventSourceFactory,
  type ProjectAdder,
  type SnapshotLoader,
} from "./data.js";
import {
  TASK_STATUSES,
  type DashboardSnapshot,
  type LedgerEvent,
  type ProjectRegistration,
  type Role,
  type SnapshotEnvelope,
  type TaskStatus,
  type TaskTreeNode,
} from "./types.js";
import "./styles.css";

type View = "Overview" | "Tasks" | "Blockers" | "Activity" | "Roles" | "Artifacts" | "Settings";
type Language = "zh" | "en";

type DashboardAppProps = {
  initialSnapshot?: DashboardSnapshot;
  projectId?: string;
  snapshotLoader?: SnapshotLoader;
  eventSourceFactory?: EventSourceFactory;
  projectListLoader?: typeof fetchProjects;
  projectAdder?: ProjectAdder;
  onRemoveProject?: () => void;
  onReconnectWatcher?: () => void;
  artifactOpener?: ArtifactOpener;
};

const STATUS_META: Record<TaskStatus, { icon: string; color: string }> = {
  NOT_STARTED: { icon: "○", color: "#94a3b8" },
  IN_PROGRESS: { icon: "●", color: "#3b82f6" },
  BLOCKED: { icon: "!", color: "#ef4444" },
  WAITING_USER: { icon: "…", color: "#f97316" },
  WAITING_REVIEW: { icon: "◌", color: "#a855f7" },
  COMPLETED: { icon: "✓", color: "#22c55e" },
  PAUSED: { icon: "Ⅱ", color: "#64748b" },
};

const STATUS_SUMMARY_STATUSES: TaskStatus[] = [
  "COMPLETED",
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING_USER",
  "NOT_STARTED",
];

const NAV_ITEMS: View[] = ["Overview", "Tasks", "Blockers", "Activity", "Roles", "Artifacts", "Settings"];

type Messages = {
  brand: string;
  brandSubtitle: string;
  workspace: string;
  dashboardNavigation: string;
  nav: Record<View, string>;
  breadcrumbProject: string;
  readOnly: string;
  languageButton: string;
  switchLanguage: string;
  streamCurrent: string;
  streamUpdated: string;
  loadingEyebrow: string;
  loadingTitle: string;
  projectOverview: string;
  projectCompletion: string;
  complete: string;
  ledgerActive: string;
  ledgerInactive: string;
  lastUpdate: string;
  progressSnapshot: string;
  leafTaskRollup: string;
  statusFilterLabel: string;
  status: Record<TaskStatus, string>;
  phases: string;
  taskCount: (count: number) => string;
  recentlyActive: string;
  noActiveTasks: string;
  tasks: string;
  leafTasks: (count: number) => string;
  taskFilters: string;
  allStatuses: string;
  allRoles: string;
  allPriorities: string;
  search: string;
  searchTasks: string;
  searchPlaceholder: string;
  taskTree: string;
  visible: (count: number) => string;
  noTaskMatch: string;
  priority: string;
  noSession: string;
  updated: string;
  details: string;
  description: string;
  dependencies: string;
  childrenLabel: string;
  artifacts: string;
  blockedReason: string;
  waitingUserReason: string;
  startedAt: string;
  completedAt: string;
  blockers: string;
  owner: string;
  blockedAt: string;
  noBlockedTasks: string;
  noWaitingTasks: string;
  noReason: string;
  userInputRequired: string;
  activity: string;
  showingEvents: (visible: number, total: number) => string;
  categories: Record<"All" | "Task" | "Session" | "Artifact" | "Test" | "User", string>;
  noActivity: string;
  roles: string;
  agent: string;
  active: string;
  completed: string;
  blocked: string;
  assignedTasks: (count: number) => string;
  validatedPaths: string;
  exists: string;
  missing: string;
  copyPath: string;
  openParentFolder: string;
  openingParentFolder: string;
  parentFolderOpened: string;
  noArtifacts: string;
  unableOpenParentFolder: string;
  projectList: string;
  registeredCount: (count: number) => string;
  connected: string;
  registered: string;
  projectRootFolder: string;
  projectRootPlaceholder: string;
  addProjectFolder: string;
  registering: string;
  projectRootHelp: string;
  projectRegistered: string;
  projectId: string;
  migrationWarnings: (count: number) => string;
  legacyFiles: (files: string) => string;
  removeProject: string;
  reconnectWatcher: string;
  readOnlyState: string;
  mutationBoundary: string;
  taskStateReadOnly: string;
  stateHelp: string;
  ledgerWriter: string;
  lastWrite: string;
  projectIdentity: string;
  projectRootRequired: string;
  unableAddProject: string;
  addResult: Record<AddProjectResult["kind"], string>;
  warningSuffix: string;
  unassigned: string;
  statusIcon: (status: TaskStatus) => string;
  progressAria: (progress: number) => string;
  readOnlyAria: string;
};

const MESSAGES: Record<Language, Messages> = {
  zh: {
    brand: "项目台账",
    brandSubtitle: "看板 V1",
    workspace: "工作区",
    dashboardNavigation: "看板导航",
    nav: { Overview: "总览", Tasks: "任务", Blockers: "阻塞项", Activity: "活动", Roles: "角色", Artifacts: "产物", Settings: "设置" },
    breadcrumbProject: "项目",
    readOnly: "只读",
    languageButton: "中文",
    switchLanguage: "切换到英文",
    streamCurrent: "台账状态正常",
    streamUpdated: "台账已更新",
    loadingEyebrow: "AI 项目台账",
    loadingTitle: "正在加载看板",
    projectOverview: "项目总览",
    projectCompletion: "项目完成度",
    complete: "已完成",
    ledgerActive: "台账运行中",
    ledgerInactive: "台账未运行",
    lastUpdate: "最近更新",
    progressSnapshot: "进度快照",
    leafTaskRollup: "叶子任务汇总",
    statusFilterLabel: "状态",
    status: { NOT_STARTED: "未开始", IN_PROGRESS: "进行中", BLOCKED: "阻塞", WAITING_USER: "等待用户", WAITING_REVIEW: "等待验收", COMPLETED: "已完成", PAUSED: "已暂停" },
    phases: "阶段",
    taskCount: (count) => `${count} 个任务`,
    recentlyActive: "最近活动",
    noActiveTasks: "暂无活动任务",
    tasks: "任务",
    leafTasks: (count) => `${count} 个叶子任务`,
    taskFilters: "任务筛选",
    allStatuses: "全部状态",
    allRoles: "全部角色",
    allPriorities: "全部优先级",
    search: "搜索",
    searchTasks: "搜索任务",
    searchPlaceholder: "输入 ID、标题或描述",
    taskTree: "任务树",
    visible: (count) => `${count} 个可见`,
    noTaskMatch: "没有符合筛选条件的任务",
    priority: "优先级",
    noSession: "无会话",
    updated: "更新于",
    details: "详情",
    description: "描述",
    dependencies: "依赖项",
    childrenLabel: "子任务",
    artifacts: "产物",
    blockedReason: "阻塞原因",
    waitingUserReason: "等待用户原因",
    startedAt: "开始时间",
    completedAt: "完成时间",
    blockers: "阻塞项",
    owner: "负责人",
    blockedAt: "阻塞于",
    noBlockedTasks: "暂无阻塞任务",
    noWaitingTasks: "暂无等待用户任务",
    noReason: "未记录原因",
    userInputRequired: "需要用户输入",
    activity: "活动",
    showingEvents: (visible, total) => `显示最近 ${visible}/${total} 条事件`,
    categories: { All: "全部", Task: "任务", Session: "会话", Artifact: "产物", Test: "测试", User: "用户" },
    noActivity: "该分类暂无活动",
    roles: "角色",
    agent: "Agent",
    active: "活跃",
    completed: "已完成",
    blocked: "阻塞",
    assignedTasks: (count) => `已分配任务（${count}）`,
    validatedPaths: "项目根目录内的已校验路径",
    exists: "存在",
    missing: "缺失",
    copyPath: "复制路径",
    openParentFolder: "打开所在文件夹",
    openingParentFolder: "正在打开…",
    parentFolderOpened: "所在文件夹已打开",
    noArtifacts: "暂无记录产物",
    unableOpenParentFolder: "无法打开所在文件夹",
    projectList: "项目列表",
    registeredCount: (count) => `${count} 个已登记`,
    connected: "已连接",
    registered: "已登记",
    projectRootFolder: "项目根目录",
    projectRootPlaceholder: "C:\\path\\to\\project",
    addProjectFolder: "添加项目文件夹",
    registering: "登记中…",
    projectRootHelp: "输入一个已存在的本地目录。localhost 台账 API 会校验并初始化或迁移它。",
    projectRegistered: "项目已登记",
    projectId: "项目 ID",
    migrationWarnings: (count) => `迁移警告：${count} 条`,
    legacyFiles: (files) => `旧文件：${files}`,
    removeProject: "从看板移除",
    reconnectWatcher: "重新连接监听",
    readOnlyState: "只读项目状态",
    mutationBoundary: "V1 变更边界",
    taskStateReadOnly: "任务状态为只读",
    stateHelp: "看板读取聚合快照和 SSE 更新。只有注册、初始化和迁移通道允许修改。",
    ledgerWriter: "台账写入器",
    lastWrite: "最近写入",
    projectIdentity: "项目标识",
    projectRootRequired: "项目根目录为必填项",
    unableAddProject: "无法添加项目",
    addResult: { existing: "已有台账已登记", migrated: "旧版 Markdown 已迁移", initialized: "已初始化空台账" },
    warningSuffix: " · 当前显示可用的最后良好快照。",
    unassigned: "未分配",
    statusIcon: (status) => `状态图标：${status}`,
    progressAria: (progress) => `${progress}% 进度`,
    readOnlyAria: "只读",
  },
  en: {
    brand: "Project Ledger",
    brandSubtitle: "Dashboard V1",
    workspace: "Workspace",
    dashboardNavigation: "Dashboard navigation",
    nav: { Overview: "Overview", Tasks: "Tasks", Blockers: "Blockers", Activity: "Activity", Roles: "Roles", Artifacts: "Artifacts", Settings: "Settings" },
    breadcrumbProject: "Project",
    readOnly: "READ-ONLY",
    languageButton: "English",
    switchLanguage: "切换到中文",
    streamCurrent: "Snapshot is current",
    streamUpdated: "Updated from ledger stream",
    loadingEyebrow: "AI Project Ledger",
    loadingTitle: "Loading dashboard",
    projectOverview: "Project Overview",
    projectCompletion: "Project completion",
    complete: "Complete",
    ledgerActive: "Ledger Active",
    ledgerInactive: "Ledger Inactive",
    lastUpdate: "Last update",
    progressSnapshot: "Progress snapshot",
    leafTaskRollup: "Leaf task rollup",
    statusFilterLabel: "Status",
    status: { NOT_STARTED: "Not Started", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", WAITING_USER: "Waiting User", WAITING_REVIEW: "Waiting Review", COMPLETED: "Completed", PAUSED: "Paused" },
    phases: "Phases",
    taskCount: (count) => `${count} tasks`,
    recentlyActive: "Recently active",
    noActiveTasks: "No active tasks",
    tasks: "Tasks",
    leafTasks: (count) => `${count} leaf tasks`,
    taskFilters: "Task filters",
    allStatuses: "All statuses",
    allRoles: "All roles",
    allPriorities: "All priorities",
    search: "Search",
    searchTasks: "Search tasks",
    searchPlaceholder: "ID, title or description",
    taskTree: "Task tree",
    visible: (count) => `${count} visible`,
    noTaskMatch: "No tasks match these filters",
    priority: "Priority",
    noSession: "No session",
    updated: "Updated",
    details: "Details",
    description: "Description",
    dependencies: "Dependencies",
    childrenLabel: "Children",
    artifacts: "Artifacts",
    blockedReason: "Blocked Reason",
    waitingUserReason: "Waiting User Reason",
    startedAt: "Started At",
    completedAt: "Completed At",
    blockers: "Blockers",
    owner: "Owner",
    blockedAt: "Blocked",
    noBlockedTasks: "No blocked tasks",
    noWaitingTasks: "No waiting_user tasks",
    noReason: "No reason recorded",
    userInputRequired: "User input required",
    activity: "Activity",
    showingEvents: (visible, total) => `Showing ${visible} of ${total} recent events`,
    categories: { All: "All", Task: "Task", Session: "Session", Artifact: "Artifact", Test: "Test", User: "User" },
    noActivity: "No activity in this category",
    roles: "Roles",
    agent: "Agent",
    active: "Active",
    completed: "Completed",
    blocked: "Blocked",
    assignedTasks: (count) => `Assigned tasks (${count})`,
    validatedPaths: "Validated paths within project root",
    exists: "Exists",
    missing: "Missing",
    copyPath: "Copy Path",
    openParentFolder: "Open Parent Folder",
    openingParentFolder: "Opening parent folder…",
    parentFolderOpened: "Parent folder opened",
    noArtifacts: "No artifacts recorded",
    unableOpenParentFolder: "Unable to open parent folder",
    projectList: "Project List",
    registeredCount: (count) => `${count} registered`,
    connected: "Connected",
    registered: "Registered",
    projectRootFolder: "Project root folder",
    projectRootPlaceholder: "C:\\path\\to\\project",
    addProjectFolder: "Add Project Folder",
    registering: "Registering…",
    projectRootHelp: "Enter an existing local directory. The localhost Ledger API validates and initializes or migrates it.",
    projectRegistered: "Project registered",
    projectId: "Project ID",
    migrationWarnings: (count) => `Migration warnings: ${count}`,
    legacyFiles: (files) => `Legacy files: ${files}`,
    removeProject: "Remove from Dashboard",
    reconnectWatcher: "Reconnect Watcher",
    readOnlyState: "Read-only project state",
    mutationBoundary: "V1 mutation boundary",
    taskStateReadOnly: "Task state is read-only",
    stateHelp: "Dashboard reads the aggregate snapshot and SSE updates. Registry, init and migration controls are the only allowed mutation paths.",
    ledgerWriter: "Ledger writer",
    lastWrite: "Last write",
    projectIdentity: "Project identity",
    projectRootRequired: "Project root folder is required",
    unableAddProject: "Unable to add project",
    addResult: { existing: "Existing ledger registered", migrated: "Legacy Markdown migrated", initialized: "Empty ledger initialized" },
    warningSuffix: " · Showing last known good snapshot when available.",
    unassigned: "Unassigned",
    statusIcon: (status) => `Status icon: ${status}`,
    progressAria: (progress) => `${progress}% progress`,
    readOnlyAria: "Read-only",
  },
};

function formatDate(value: string | null, language: Language = "zh"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function roleName(roles: Role[], roleId: string | null | undefined, copy: Messages): string {
  return roles.find((role) => role.id === roleId)?.name ?? roleId ?? copy.unassigned;
}

function eventCategory(event: LedgerEvent): "Task" | "Session" | "Artifact" | "Test" | "User" {
  if (event.type.startsWith("TASK_")) return "Task";
  if (event.type.startsWith("SESSION_")) return "Session";
  if (event.type.startsWith("ARTIFACT_")) return "Artifact";
  if (event.type.startsWith("TEST_")) return "Test";
  return "User";
}

function StatusBadge({ status, copy }: { status: TaskStatus; copy: Messages }) {
  const meta = STATUS_META[status];
  return (
    <span className="status-badge" style={{ color: meta.color } as CSSProperties}>
      <span className="status-icon" role="img" aria-label={copy.statusIcon(status)}>
        {meta.icon}
      </span>
      <span>{copy.status[status]}</span>
    </span>
  );
}

function ProgressBar({ status, progress, copy }: { status: TaskStatus; progress: number; copy: Messages }) {
  const meta = STATUS_META[status];
  return (
    <div className="progress-row">
      <div className="progress-track" aria-label={copy.progressAria(progress)}>
        <span className="progress-fill" style={{ width: `${progress}%`, backgroundColor: meta.color }} />
      </div>
      <span className="progress-value">{progress}%</span>
    </div>
  );
}

function Panel({ title, eyebrow, children, actions }: { title: string; eyebrow?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function TaskCard({ task, roles, copy, language, nested = false }: { task: TaskTreeNode; roles: Role[]; copy: Messages; language: Language; nested?: boolean }) {
  const meta = STATUS_META[task.status];
  return (
    <li className={nested ? "task-tree-item nested" : "task-tree-item"}>
      <article className="task-card" data-testid={`task-card-${task.id}`}>
        <span className="task-status-bar" data-testid="status-bar" data-color={meta.color} style={{ backgroundColor: meta.color }} />
        <div className="task-card-main">
          <div className="task-card-title-row">
            <span className="task-id">{task.id}</span>
            <h3>{task.title}</h3>
            <StatusBadge status={task.status} copy={copy} />
          </div>
          <div className="task-card-details">
            <ProgressBar status={task.status} progress={task.progress} copy={copy} />
            <span className="detail-chip">{copy.priority} {task.priority}</span>
            <span className="detail-chip">{roleName(roles, task.roleId, copy)}</span>
            <span className="detail-chip">{task.agent}</span>
            <span className="detail-chip">{task.sessionId ?? copy.noSession}</span>
            <span className="detail-muted">{copy.updated} {formatDate(task.updatedAt, language)}</span>
          </div>
          <details className="task-details">
            <summary>{copy.details}</summary>
            <div className="task-detail-grid">
              <span><strong>{copy.description}</strong>{task.description}</span>
              <span><strong>{copy.dependencies}</strong>{task.dependsOn.length ? task.dependsOn.join(", ") : "—"}</span>
              <span><strong>{copy.childrenLabel}</strong>{task.children.length ? task.children.map((child) => child.id).join(", ") : "—"}</span>
              <span><strong>{copy.artifacts}</strong>{task.artifacts.length ? task.artifacts.join(", ") : "—"}</span>
              {task.blockedReason && <span><strong>{copy.blockedReason}</strong>{task.blockedReason}</span>}
              {task.waitingUserReason && <span><strong>{copy.waitingUserReason}</strong>{task.waitingUserReason}</span>}
              <span><strong>{copy.startedAt}</strong>{formatDate(task.startedAt, language)}</span>
              <span><strong>{copy.completedAt}</strong>{formatDate(task.completedAt, language)}</span>
            </div>
          </details>
        </div>
      </article>
      {task.children.length > 0 && (
        <ul className="task-tree-children">
          {task.children.map((child) => <TaskCard key={child.id} task={child} roles={roles} copy={copy} language={language} nested />)}
        </ul>
      )}
    </li>
  );
}

type TaskFilters = {
  status: TaskStatus | "ALL";
  role: string;
  priority: string;
  search: string;
};

function filterTaskTree(nodes: TaskTreeNode[], filters: TaskFilters): TaskTreeNode[] {
  const search = filters.search.trim().toLowerCase();
  const matches = (task: TaskTreeNode): boolean => {
    const haystack = `${task.id} ${task.title} ${task.description}`.toLowerCase();
    return (filters.status === "ALL" || task.status === filters.status)
      && (!filters.role || task.roleId === filters.role)
      && (!filters.priority || task.priority === filters.priority)
      && (!search || haystack.includes(search));
  };

  return nodes.flatMap((node) => {
    const children = filterTaskTree(node.children, filters);
    if (!matches(node) && children.length === 0) return [];
    return [{ ...node, children }];
  });
}

function Overview({ snapshot, copy, language }: { snapshot: DashboardSnapshot; copy: Messages; language: Language }) {
  const currentTasks = snapshot.tasks.filter((task) => snapshot.runtime.currentTaskIds.includes(task.id));
  return (
    <>
      <div className="hero-grid">
        <div>
          <p className="eyebrow">{copy.projectOverview}</p>
          <h1>{snapshot.project.name}</h1>
          <p className="path-value">{snapshot.rootPath}</p>
        </div>
        <div
          className="completion-card"
          role="progressbar"
          aria-label={copy.projectCompletion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={snapshot.summary.progress}
        >
          <span className="completion-value">{snapshot.summary.progress}%</span>
          <span>{copy.complete}</span>
        </div>
        <div className="runtime-card">
          <span className={`runtime-dot ${snapshot.runtime.active ? "active" : ""}`} />
          <div><strong>{snapshot.runtime.active ? copy.ledgerActive : copy.ledgerInactive}</strong><span>{copy.lastUpdate} {formatDate(snapshot.runtime.lastWriteAt, language)}</span></div>
        </div>
      </div>

      <Panel title={copy.progressSnapshot} eyebrow={copy.leafTaskRollup}>
        <div className="metric-grid">
          {STATUS_SUMMARY_STATUSES.map((status) => (
            <div className="metric-card" key={status}>
              <span className="metric-label">{copy.status[status]}</span>
              <strong style={{ color: STATUS_META[status].color }}>{snapshot.summary.byStatus[status]}</strong>
              <StatusBadge status={status} copy={copy} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="two-column-grid">
        <Panel title={copy.phases}>
          <div className="phase-list">
            {snapshot.phases.map((phase) => (
              <div className="phase-row" key={phase.id}>
                <div className="phase-label"><span>{phase.name}</span><small>{copy.taskCount(phase.taskCount)}</small></div>
                <div className="phase-progress"><span style={{ width: `${phase.progress}%` }} /><strong>{phase.progress}%</strong></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={copy.recentlyActive}>
          {currentTasks.length ? currentTasks.map((task) => (
            <div className="active-task" key={task.id}>
              <span className="task-id">{task.id}</span>
              <div><strong>{task.title}</strong><span>{roleName(snapshot.roles, task.roleId, copy)} · {task.agent}</span></div>
              <span className="active-progress">{task.progress}%</span>
            </div>
          )) : <EmptyState label={copy.noActiveTasks} />}
        </Panel>
      </div>
    </>
  );
}

function Tasks({ snapshot, copy, language }: { snapshot: DashboardSnapshot; copy: Messages; language: Language }) {
  const [filters, setFilters] = useState<TaskFilters>({ status: "ALL", role: "", priority: "", search: "" });
  const tree = useMemo(() => filterTaskTree(snapshot.taskTree, filters), [filters, snapshot.taskTree]);
  const priorities = [...new Set(snapshot.tasks.map((task) => task.priority))].sort();
  return (
    <Panel title={copy.tasks} eyebrow={copy.leafTasks(snapshot.summary.total)} actions={<span className="read-only-pill">{copy.readOnly}</span>}>
      <div className="filter-bar" aria-label={copy.taskFilters}>
        <label>{copy.statusFilterLabel}<select aria-label={copy.statusFilterLabel} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as TaskStatus | "ALL" })}><option value="ALL">{copy.allStatuses}</option>{TASK_STATUSES.map((status) => <option key={status} value={status}>{copy.status[status]}</option>)}</select></label>
        <label>{copy.roles}<select aria-label={copy.roles} value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}><option value="">{copy.allRoles}</option>{snapshot.roles.map((role) => <option key={role.id} value={role.id}>{role.id} · {role.name}</option>)}</select></label>
        <label>{copy.priority}<select aria-label={copy.priority} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">{copy.allPriorities}</option>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
        <label className="search-field">{copy.search}<input type="search" aria-label={copy.searchTasks} placeholder={copy.searchPlaceholder} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
      </div>
      {tree.length ? (
        <div className="task-tree" aria-label={copy.taskTree}>
          {snapshot.phases.map((phase) => {
            const phaseTasks = tree.filter((task) => task.phaseId === phase.id);
            if (!phaseTasks.length) return null;
            return <section className="phase-group" key={phase.id}><div className="phase-group-heading"><h3>{phase.name}</h3><span>{copy.visible(phaseTasks.length)}</span></div><ul>{phaseTasks.map((task) => <TaskCard key={task.id} task={task} roles={snapshot.roles} copy={copy} language={language} />)}</ul></section>;
          })}
        </div>
      ) : <EmptyState label={copy.noTaskMatch} />}
    </Panel>
  );
}

function Blockers({ snapshot, copy, language }: { snapshot: DashboardSnapshot; copy: Messages; language: Language }) {
  const blocked = snapshot.tasks.filter((task) => task.status === "BLOCKED");
  const waiting = snapshot.tasks.filter((task) => task.status === "WAITING_USER");
  const blockerSection = (title: "BLOCKED" | "WAITING_USER", tasks: typeof blocked, reason: (task: typeof blocked[number]) => string) => (
    <section className="blocker-section" role="region" aria-label={copy.status[title]}>
      <div className="section-heading"><div><StatusBadge status={title} copy={copy} /><h2>{copy.status[title]}</h2></div><span>{tasks.length}</span></div>
      {tasks.length ? tasks.map((task) => <article className="blocker-card" key={task.id}><div><span className="task-id">{task.id}</span><h3>{task.title}</h3><p>{reason(task)}</p></div><div><span className="detail-muted">{copy.owner}</span><strong>{roleName(snapshot.roles, task.roleId, copy)}</strong><span className="detail-muted">{copy.blockedAt} {formatDate(task.updatedAt, language)}</span></div></article>) : <EmptyState label={title === "BLOCKED" ? copy.noBlockedTasks : copy.noWaitingTasks} />}
    </section>
  );
  return <div className="blocker-stack">{blockerSection("BLOCKED", blocked, (task) => task.blockedReason ?? copy.noReason)}{blockerSection("WAITING_USER", waiting, (task) => task.waitingUserReason ?? copy.userInputRequired)}</div>;
}

function Activity({ snapshot, copy, language }: { snapshot: DashboardSnapshot; copy: Messages; language: Language }) {
  const [filter, setFilter] = useState<"All" | "Task" | "Session" | "Artifact" | "Test" | "User">("All");
  const events = snapshot.recentEvents.length ? snapshot.recentEvents : snapshot.events.slice(-200);
  const visible = filter === "All" ? events : events.filter((event) => eventCategory(event) === filter);
  return <Panel title={copy.activity} eyebrow={copy.showingEvents(visible.length, events.length)} actions={<div className="segmented-control">{["All", "Task", "Session", "Artifact", "Test", "User"].map((item) => <button type="button" className={filter === item ? "selected" : ""} key={item} onClick={() => setFilter(item as typeof filter)}>{copy.categories[item as keyof typeof copy.categories]}</button>)}</div>}>
    <div className="activity-list">{visible.length ? visible.slice().reverse().map((event) => <article className="activity-row" key={event.eventId}><time>{formatDate(event.ts, language)}</time><span className="activity-type">{event.type}</span><span>{event.taskId ?? event.artifactId ?? event.sessionId ?? "—"}</span><span className="detail-muted">{event.actor}</span></article>) : <EmptyState label={copy.noActivity} />}</div>
  </Panel>;
}

function Roles({ snapshot, copy }: { snapshot: DashboardSnapshot; copy: Messages }) {
  return <div className="role-grid">{snapshot.roles.map((role) => { const tasks = snapshot.tasks.filter((task) => task.roleId === role.id); const active = snapshot.sessions.filter((session) => session.roleId === role.id && session.status === "ACTIVE").length; return <article className="role-card" key={role.id}><div className="role-heading"><span className="role-id">{role.id}</span><div><h2>{role.name}</h2><p>{copy.agent}: {role.agent}</p></div></div><div className="role-stats"><span><strong>{active}</strong> {copy.active}</span><span><strong>{tasks.filter((task) => task.status === "COMPLETED").length}</strong> {copy.completed}</span><span><strong>{tasks.filter((task) => task.status === "BLOCKED").length}</strong> {copy.blocked}</span></div><details><summary>{copy.assignedTasks(tasks.length)}</summary><ul>{tasks.map((task) => <li key={task.id}><span>{task.id}</span>{task.title}<StatusBadge status={task.status} copy={copy} /></li>)}</ul></details></article>; })}</div>;
}

async function copyPath(path: string): Promise<void> {
  if (navigator.clipboard) await navigator.clipboard.writeText(path);
}

type ArtifactActionState = {
  status: "opening" | "success" | "error";
  message: string;
};

function Artifacts({ snapshot, artifactOpener = openArtifactParentFolder, copy }: { snapshot: DashboardSnapshot; artifactOpener?: ArtifactOpener; copy: Messages }) {
  const [actionStates, setActionStates] = useState<Record<string, ArtifactActionState>>({});
  const grouped = snapshot.artifacts.reduce<Record<string, typeof snapshot.artifacts>>((result, artifact) => { (result[artifact.type] ??= []).push(artifact); return result; }, {});
  const openParentFolder = async (artifactId: string, artifactPath: string): Promise<void> => {
    setActionStates((current) => ({ ...current, [artifactId]: { status: "opening", message: copy.openingParentFolder } }));
    try {
      await artifactOpener(snapshot.projectId, artifactPath);
      setActionStates((current) => ({ ...current, [artifactId]: { status: "success", message: copy.parentFolderOpened } }));
    } catch (actionError) {
      setActionStates((current) => ({
        ...current,
        [artifactId]: {
          status: "error",
          message: actionError instanceof Error ? actionError.message : copy.unableOpenParentFolder,
        },
      }));
    }
  };
  return <Panel title={copy.artifacts} eyebrow={copy.validatedPaths}><div className="artifact-groups">{Object.keys(grouped).length ? Object.entries(grouped).map(([type, artifacts]) => <section className="artifact-group" key={type}><div className="section-heading"><h2>{type}</h2><span>{artifacts.length}</span></div>{artifacts.map((artifact) => { const actionState = actionStates[artifact.id]; return <article className="artifact-row" key={artifact.id}><div><span className="task-id">{artifact.id} · {artifact.taskId}</span><code>{artifact.path}</code><span className={artifact.exists ? "exists" : "missing"}>{artifact.exists ? copy.exists : copy.missing}</span></div><div className="artifact-actions"><button type="button" onClick={() => void copyPath(artifact.path)}>{copy.copyPath}</button><button type="button" disabled={actionState?.status === "opening"} onClick={() => void openParentFolder(artifact.id, artifact.path)}>{actionState?.status === "opening" ? copy.openingParentFolder : copy.openParentFolder}</button></div>{actionState && <p role={actionState.status === "error" ? "alert" : "status"} aria-live="polite">{actionState.message}</p>}</article>; })}</section>) : <EmptyState label={copy.noArtifacts} />}</div></Panel>;
}

function Settings({ snapshot, projects, onAddProject, onRemoveProject, onReconnectWatcher, copy, language }: DashboardAppProps & { snapshot: DashboardSnapshot; projects: ProjectRegistration[]; onAddProject: ProjectAdder; copy: Messages; language: Language }) {
  const [rootPath, setRootPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<AddProjectResult | null>(null);
  const registeredProjects = projects.length ? projects : [{
    projectId: snapshot.projectId,
    name: snapshot.project.name,
    rootPath: snapshot.rootPath,
  }];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmedRootPath = rootPath.trim();
    if (!trimmedRootPath) {
      setAddResult(null);
      setAddError(copy.projectRootRequired);
      return;
    }

    setSubmitting(true);
    setAddError(null);
    setAddResult(null);
    try {
      const result = await onAddProject(trimmedRootPath);
      setAddResult(result);
      setRootPath("");
    } catch (error) {
      setAddError(error instanceof Error ? error.message : copy.unableAddProject);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="settings-grid"><Panel title={copy.projectList} actions={<span className="detail-muted">{copy.registeredCount(registeredProjects.length)}</span>}><div className="registered-project-list">{registeredProjects.map((project) => <article className="registered-project" aria-current={project.projectId === snapshot.projectId ? "true" : undefined} key={project.projectId}><span className={`runtime-dot ${project.projectId === snapshot.projectId ? "active" : ""}`} /><div><strong>{project.name}</strong><span>{project.rootPath}</span></div><span className="detail-muted">{project.projectId === snapshot.projectId ? copy.connected : copy.registered}</span></article>)}</div><form className="project-add-form" onSubmit={(event) => void handleSubmit(event)}><label htmlFor="project-root">{copy.projectRootFolder}</label><div className="project-add-row"><input id="project-root" name="rootPath" type="text" value={rootPath} onChange={(event) => setRootPath(event.target.value)} aria-describedby="project-root-help" placeholder={copy.projectRootPlaceholder} /><button type="submit" disabled={submitting}>{submitting ? copy.registering : copy.addProjectFolder}</button></div><p id="project-root-help">{copy.projectRootHelp}</p></form>{addError && <p className="project-add-feedback error" role="alert">{addError}</p>}{addResult && <div className="project-add-feedback success" role="status" aria-live="polite"><strong>{copy.projectRegistered}</strong><span>{copy.addResult[addResult.kind]}</span><span>{copy.projectId}: {addResult.project.projectId}</span>{addResult.warnings.length > 0 && <span>{copy.migrationWarnings(addResult.warnings.length)}</span>}{addResult.legacyFiles.length > 0 && <span>{copy.legacyFiles(addResult.legacyFiles.join(", "))}</span>}</div>}<div className="settings-actions"><button type="button" onClick={onRemoveProject}>{copy.removeProject}</button><button type="button" onClick={onReconnectWatcher}>{copy.reconnectWatcher}</button></div></Panel><Panel title={copy.readOnlyState} eyebrow={copy.mutationBoundary}><div className="read-only-notice"><span className="lock-icon" role="img" aria-label={copy.readOnlyAria}>▣</span><div><strong>{copy.taskStateReadOnly}</strong><p>{copy.stateHelp}</p></div></div><dl className="settings-list"><div><dt>{copy.ledgerWriter}</dt><dd>{snapshot.runtime.ledgerWriter}</dd></div><div><dt>{copy.lastWrite}</dt><dd>{formatDate(snapshot.runtime.lastWriteAt, language)}</dd></div><div><dt>{copy.projectIdentity}</dt><dd>{snapshot.projectId}</dd></div></dl></Panel></div>;
}

function EmptyState({ label }: { label: string }) { return <div className="empty-state">{label}</div>; }

type SharedSnapshotRequest = {
  controller: AbortController;
  promise: Promise<SnapshotEnvelope>;
  consumers: number;
};

const pendingSnapshotRequests = new Map<string, SharedSnapshotRequest>();

function acquireSnapshotRequest(projectId: string, loader: SnapshotLoader): { promise: SharedSnapshotRequest["promise"]; release: () => void } {
  const existing = pendingSnapshotRequests.get(projectId);
  if (existing) {
    existing.consumers += 1;
    return { promise: existing.promise, release: () => releaseSnapshotRequest(projectId, existing) };
  }

  const controller = new AbortController();
  let promise: Promise<SnapshotEnvelope>;
  try {
    promise = loader(projectId, controller.signal);
  } catch (error) {
    promise = Promise.reject(error);
  }
  const request: SharedSnapshotRequest = { controller, promise, consumers: 1 };
  pendingSnapshotRequests.set(projectId, request);
  promise.then(
    () => clearCompletedSnapshotRequest(projectId, request),
    () => clearCompletedSnapshotRequest(projectId, request),
  );
  return { promise, release: () => releaseSnapshotRequest(projectId, request) };
}

function clearCompletedSnapshotRequest(projectId: string, request: SharedSnapshotRequest): void {
  if (pendingSnapshotRequests.get(projectId) === request) pendingSnapshotRequests.delete(projectId);
}

function releaseSnapshotRequest(projectId: string, request: SharedSnapshotRequest): void {
  if (pendingSnapshotRequests.get(projectId) !== request) return;
  request.consumers -= 1;
  if (request.consumers > 0) return;
  queueMicrotask(() => {
    if (pendingSnapshotRequests.get(projectId) !== request || request.consumers > 0) return;
    request.controller.abort();
    pendingSnapshotRequests.delete(projectId);
  });
}

function DashboardContent({ view, snapshot, props, projects, onAddProject, copy, language }: { view: View; snapshot: DashboardSnapshot; props: DashboardAppProps; projects: ProjectRegistration[]; onAddProject: ProjectAdder; copy: Messages; language: Language }) {
  switch (view) {
    case "Overview": return <Overview snapshot={snapshot} copy={copy} language={language} />;
    case "Tasks": return <Tasks snapshot={snapshot} copy={copy} language={language} />;
    case "Blockers": return <Blockers snapshot={snapshot} copy={copy} language={language} />;
    case "Activity": return <Activity snapshot={snapshot} copy={copy} language={language} />;
    case "Roles": return <Roles snapshot={snapshot} copy={copy} />;
    case "Artifacts": return <Artifacts snapshot={snapshot} artifactOpener={props.artifactOpener} copy={copy} />;
    case "Settings": return <Settings {...props} snapshot={snapshot} projects={projects} onAddProject={onAddProject} copy={copy} language={language} />;
  }
}

export function DashboardApp(props: DashboardAppProps) {
  const [view, setView] = useState<View>("Overview");
  const [language, setLanguage] = useState<Language>("zh");
  const copy = MESSAGES[language];
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | undefined>(props.initialSnapshot);
  const initialProjectId = props.projectId
    ?? new URLSearchParams(window.location.search).get("projectId")
    ?? props.initialSnapshot?.projectId;
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(initialProjectId);
  const [projects, setProjects] = useState<ProjectRegistration[]>(() => props.initialSnapshot ? [{
    projectId: props.initialSnapshot.projectId,
    name: props.initialSnapshot.project.name,
    rootPath: props.initialSnapshot.rootPath,
  }] : []);
  const [remoteReloadEnabled, setRemoteReloadEnabled] = useState(!props.initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState("Snapshot is current");

  const handleAddProject = async (rootPath: string): Promise<AddProjectResult> => {
    const result = await (props.projectAdder ?? addProject)(rootPath);
    const refreshedProjects = await (props.projectListLoader ?? fetchProjects)();
    setProjects(refreshedProjects);
    setRemoteReloadEnabled(true);
    setActiveProjectId(result.project.projectId);
    setError(null);
    return result;
  };

  useEffect(() => {
    if (props.initialSnapshot && !remoteReloadEnabled) return;
    const controller = new AbortController();
    let releaseSnapshot: () => void = () => undefined;
    let unsubscribe: () => void = () => undefined;
    let active = true;
    const load = async () => {
      try {
        const loadedProjects = activeProjectId ? undefined : await (props.projectListLoader ?? fetchProjects)(controller.signal);
        if (loadedProjects) setProjects(loadedProjects);
        const projectId = activeProjectId ?? loadedProjects?.[0]?.projectId;
        if (!projectId) throw new Error("No registered projects");
        if (!activeProjectId) setActiveProjectId(projectId);
        const request = acquireSnapshotRequest(projectId, props.snapshotLoader ?? fetchProjectSnapshot);
        releaseSnapshot = request.release;
        const envelope = await request.promise;
        if (!active) return;
        setSnapshot(envelope.snapshot);
        setError(envelope.warning?.message ?? null);
        unsubscribe = subscribeToProject(projectId, (next) => { if (active) { setSnapshot(next.snapshot); setError(next.warning?.message ?? null); setStreamStatus("Updated from ledger stream"); } }, (streamError) => { if (active) setStreamStatus(streamError.message); }, props.eventSourceFactory);
      } catch (loadError) {
        if (active && !controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
      }
    };
    void load();
    return () => { active = false; controller.abort(); releaseSnapshot(); unsubscribe(); };
  }, [activeProjectId, props.eventSourceFactory, props.initialSnapshot, props.projectListLoader, props.snapshotLoader, remoteReloadEnabled]);

  if (!snapshot) return <div className="app-shell centered"><div className="loading-card"><span className="eyebrow">{copy.loadingEyebrow}</span><h1>{copy.loadingTitle}</h1>{error && <p role="alert">{error}</p>}</div></div>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand-mark"><span>AI</span><div><strong>{copy.brand}</strong><small>{copy.brandSubtitle}</small></div></div><div className="sidebar-project"><span className="project-avatar">{snapshot.project.name.slice(0, 1)}</span><div><strong>{snapshot.project.name}</strong><span>{snapshot.projectId}</span></div></div><nav aria-label={copy.dashboardNavigation}><p className="nav-label">{copy.workspace}</p>{NAV_ITEMS.map((item) => <button type="button" className={view === item ? "nav-item active" : "nav-item"} aria-current={view === item ? "page" : undefined} key={item} onClick={() => setView(item)}><span className="nav-icon" aria-hidden="true">{item === "Overview" ? "◈" : item === "Tasks" ? "☷" : item === "Blockers" ? "!" : item === "Activity" ? "◷" : item === "Roles" ? "◎" : item === "Artifacts" ? "◇" : "⚙"}</span>{copy.nav[item]}</button>)}</nav><div className="sidebar-footer"><span className={`stream-indicator ${streamStatus === "Snapshot is current" || streamStatus === "Updated from ledger stream" ? "connected" : ""}`} /><span>{streamStatus === "Snapshot is current" ? copy.streamCurrent : streamStatus === "Updated from ledger stream" ? copy.streamUpdated : streamStatus}</span></div></aside><main className="main-content"><header className="topbar"><div><span className="breadcrumb">{copy.breadcrumbProject} / {copy.nav[view]}</span><h1>{copy.nav[view]}</h1></div><div className="topbar-meta"><button type="button" className="language-toggle" aria-label={copy.switchLanguage} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}><span aria-hidden="true">{copy.languageButton}</span></button><span className="read-only-pill">{copy.readOnly}</span><span>{formatDate(snapshot.project.updatedAt, language)}</span></div></header>{error && <div className="warning-banner" role="status">{error}{copy.warningSuffix}</div>}<div className="content-scroll"><DashboardContent view={view} snapshot={snapshot} props={props} projects={projects} onAddProject={handleAddProject} copy={copy} language={language} /></div></main></div>;
}
