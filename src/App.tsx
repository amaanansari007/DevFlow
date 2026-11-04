import AuthPage from "./AuthPage";
import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  LogOut,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Zap,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import "./App.css";
import {
  createTaskRequest,
  fetchTasks,
  updateTaskStatusRequest,
  updateTaskRequest,
  deleteTaskRequest,
  getCurrentUser,
  logoutRequest,
  fetchProjects,
  createProjectRequest,
  updateProjectRequest,
  deleteProjectRequest,
  type Project,
  type ProjectInput,
  type Priority,
  type Task,
  type TaskStatus,
  type User,
} from "./api";



const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design onboarding experience",
    project: "Website redesign",
    status: "In progress",
    priority: "High",
    due: "Oct 23",
    assignees: ["AS", "RK"],
    comments: 4,
    files: 2,
    accent: "purple",
  },
  {
    id: 2,
    title: "Create responsive dashboard layout",
    project: "Website redesign",
    status: "To do",
    priority: "High",
    due: "Oct 24",
    assignees: ["AS"],
    comments: 2,
    files: 1,
    accent: "purple",
  },
  {
    id: 3,
    title: "Set up authentication flow",
    project: "DevFlow App",
    status: "In progress",
    priority: "Medium",
    due: "Oct 25",
    assignees: ["MJ", "AS"],
    comments: 6,
    files: 0,
    accent: "green",
  },
  {
    id: 4,
    title: "Write API documentation",
    project: "DevFlow App",
    status: "To do",
    priority: "Low",
    due: "Oct 27",
    assignees: ["AS", "KD"],
    comments: 1,
    files: 1,
    accent: "green",
  },
  {
    id: 5,
    title: "User testing & feedback",
    project: "Mobile application",
    status: "Done",
    priority: "Medium",
    due: "Oct 20",
    assignees: ["RK", "MJ"],
    comments: 8,
    files: 3,
    accent: "orange",
  },
  {
    id: 6,
    title: "Create component library",
    project: "Website redesign",
    status: "Done",
    priority: "High",
    due: "Oct 19",
    assignees: ["KD"],
    comments: 3,
    files: 2,
    accent: "purple",
  },
  {
    id: 7,
    title: "Prepare sprint retrospective",
    project: "DevFlow App",
    status: "In progress",
    priority: "Low",
    due: "Oct 28",
    assignees: ["MJ"],
    comments: 1,
    files: 0,
    accent: "green",
  },
  {
    id: 8,
    title: "Review pull requests",
    project: "DevFlow App",
    status: "To do",
    priority: "Medium",
    due: "Oct 29",
    assignees: ["AS", "KD"],
    comments: 5,
    files: 0,
    accent: "green",
  },
  {
    id: 9,
    title: "Update landing page copy",
    project: "Website redesign",
    status: "Done",
    priority: "Low",
    due: "Oct 26",
    assignees: ["RK"],
    comments: 2,
    files: 1,
    accent: "purple",
  },
];

let taskLoadPromise: Promise<Task[]> | null = null;

async function loadTasksWithMigration(): Promise<Task[]> {
  if (!taskLoadPromise) {
    taskLoadPromise = (async () => {
      // First, check the database.
      const databaseTasks = await fetchTasks();

      if (databaseTasks.length > 0) {
        localStorage.setItem("devflow-api-migrated", "true");
        return databaseTasks;
      }

      // Avoid importing the tasks again after migration.
      if (localStorage.getItem("devflow-api-migrated") === "true") {
        return [];
      }

      // Read tasks from the previous frontend version.
      let oldTasks: Task[] = [];

      try {
        const saved = localStorage.getItem("devflow-tasks");

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            oldTasks = parsed as Task[];
          }
        }
      } catch {
        oldTasks = [];
      }

      // Use old tasks, or sample tasks for a new database.
      const tasksToImport =
        oldTasks.length > 0 ? oldTasks : initialTasks;

      for (const task of tasksToImport) {
        await createTaskRequest({
          title: task.title,
          project: task.project,
          status: task.status,
          priority: task.priority,
          due: task.due,
        });
      }

      localStorage.setItem("devflow-api-migrated", "true");

      // Return tasks with their real database IDs.
      return await fetchTasks();
    })();
  }

  try {
    return await taskLoadPromise;
  } catch (error) {
    taskLoadPromise = null;
    throw error;
  }
}



const navigation: { label: string; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My tasks", icon: ListTodo },
  { label: "Projects", icon: FolderKanban },
];

const columns: {
  title: TaskStatus;
  id: string;
  icon: LucideIcon;
}[] = [
  { title: "To do", id: "todo", icon: Circle },
  { title: "In progress", id: "progress", icon: Clock3 },
  { title: "Done", id: "done", icon: CheckCircle2 },
];



function TaskCard({
  task,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const statusClass =
    task.status === "To do"
      ? "todo"
      : task.status === "In progress"
        ? "progress"
        : "done";

  return (
    <article className="task-card">
      <div className="task-card-top">
        <span className={`project-tag ${task.accent}`}>
          <span className="project-dot" />
          {task.project}
        </span>
        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>

      <h3>
        <button
          type="button"
          className="task-title-button"
          onClick={() => onView(task)}
          aria-label={`View details for ${task.title}`}
        >
          {task.title}
        </button>
      </h3>

      <div className="task-due">
        <CalendarDays size={14} />
        <span>{task.due}</span>
      </div>

      <div className="task-card-footer">
        <div className="avatar-stack" aria-label="Assigned team members">
          {task.assignees.map((person, index) => (
            <span
              key={person}
              className={`mini-avatar avatar-${index % 3}`}
              title={person}
            >
              {person}
            </span>
          ))}
        </div>

        <div className="task-meta">
          {task.comments > 0 && (
            <span title={`${task.comments} comments`}>
              <MessageSquare size={14} />
              {task.comments}
            </span>
          )}
          {task.files > 0 && (
            <span title={`${task.files} attachments`}>
              <Paperclip size={14} />
              {task.files}
            </span>
          )}
        </div>
      </div>

      <div className="task-card-actions">
        <button
          type="button"
          className="task-action-button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          title="Edit task"
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          type="button"
          className="task-action-button danger"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <div className="task-move">
        <span>Move to</span>
        <select
          className={`status-select ${statusClass}`}
          value={task.status}
          aria-label={`Change status for ${task.title}`}
          onChange={(event) =>
            onStatusChange(task.id, event.target.value as TaskStatus)
          }
        >
          <option value="To do">To do</option>
          <option value="In progress">In progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </article>
  );
}

function getUserInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "U";
}

function App() {
  
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [isAuthLoading, setIsAuthLoading] = useState(true);
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoadingTasks, setIsLoadingTasks] = useState(true);
const [apiError, setApiError] = useState<string | null>(null);
const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
const [projects, setProjects] = useState<Project[]>([]);


const [showProjectModal, setShowProjectModal] = useState(false);
const [editingProject, setEditingProject] = useState<Project | null>(null);

const [projectName, setProjectName] = useState("");
const [projectDescription, setProjectDescription] = useState("");

const [projectAccent, setProjectAccent] =
  useState<ProjectInput["accent"]>("purple");

const [projectSaving, setProjectSaving] = useState(false);



const projectNames: string[] = projects.map(
  (project: Project) => project.name
);

const [isLoadingProjects, setIsLoadingProjects] = useState(true);
const [projectError, setProjectError] = useState<string | null>(null);
const [taskStatusFilter, setTaskStatusFilter] =
  useState<"All" | TaskStatus>("All");
useEffect(() => {
  let cancelled = false;

  async function initializeSession() {
    try {
      const user = await getCurrentUser();

      if (cancelled) return;

      setCurrentUser(user);

      if (user) {
        const [loadedTasks, loadedProjects] = await Promise.all([
          loadTasksWithMigration(),
          fetchProjects(),
        ]);

        if (!cancelled) {
          setTasks(loadedTasks);
          setProjects(loadedProjects);
          if (loadedProjects.length > 0) {
            setNewTaskProject((current) =>
              loadedProjects.some((project) => project.name === current)
                ? current
                : loadedProjects[0].name,
            );
          }
        }
      }
    } catch (error) {
      if (!cancelled) {
        setApiError(
          error instanceof Error
            ? error.message
            : "Could not check your login session.",
        );
      }
    } finally {
      if (!cancelled) {
        setIsAuthLoading(false);
        setIsLoadingTasks(false);
        setIsLoadingProjects(false);
      }
    }
  }

  void initializeSession();

  return () => {
    cancelled = true;
  };
}, []);


  const [search, setSearch] = useState("");
  
  
  const [activeNav, setActiveNav] = useState<string>(() => {
    const saved = window.history.state;

    return saved?.devFlowRoute === true &&
      typeof saved.activeNav === "string"
      ? saved.activeNav
      : "Overview";
  });

  const [selectedProject, setSelectedProject] = useState<string | null>(() => {
    const saved = window.history.state;

    return saved?.devFlowRoute === true &&
      typeof saved.selectedProject === "string"
      ? saved.selectedProject
      : null;
  });


  const [showNotifications, setShowNotifications] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("No date");
  const [newTaskProject, setNewTaskProject] = useState("DevFlow App");
  const [newTaskStatus, setNewTaskStatus] =
    useState<TaskStatus>("To do");
  const [newTaskPriority, setNewTaskPriority] =
    useState<Priority>("Medium");

   
// Change pages through one helper so every in-app navigation is saved
// as a separate browser-history entry.
function navigateToPage(nextNav: string, nextProject: string | null = null) {
  const current = window.history.state;
  const alreadyOnThisPage =
    current?.devFlowRoute === true &&
    current.activeNav === nextNav &&
    (current.selectedProject ?? null) === nextProject;

  if (!alreadyOnThisPage) {
    window.history.pushState(
      {
        devFlowRoute: true,
        activeNav: nextNav,
        selectedProject: nextProject,
      },
      "",
      window.location.href,
    );
  }

  setActiveNav(nextNav);
  setSelectedProject(nextProject);
  setSearch("");
  setTaskStatusFilter("All");
}

// Update the current history entry when the current page itself is renamed
// or removed, without creating a misleading extra Back step.
function replaceCurrentPage(nextNav: string, nextProject: string | null = null) {
  window.history.replaceState(
    {
      devFlowRoute: true,
      activeNav: nextNav,
      selectedProject: nextProject,
    },
    "",
    window.location.href,
  );

  setActiveNav(nextNav);
  setSelectedProject(nextProject);
  setSearch("");
  setTaskStatusFilter("All");
}

function openProjectView(projectName: string) {
  navigateToPage("Projects", projectName);
}

function openProjectsCollection() {
  navigateToPage("Projects", null);
}

// Mark the first loaded page as the starting DevFlow history entry.
useEffect(() => {
  if (window.history.state?.devFlowRoute !== true) {
    window.history.replaceState(
      {
        devFlowRoute: true,
        activeNav,
        selectedProject,
      },
      "",
      window.location.href,
    );
  }
}, []);

// Restore the exact DevFlow page stored in the history entry on Back/Forward.
useEffect(() => {
  const handleBrowserNavigation = (event: PopStateEvent) => {
    const saved = event.state;
    const isDevFlowPage = saved?.devFlowRoute === true;

    setActiveNav(
      isDevFlowPage && typeof saved.activeNav === "string"
        ? saved.activeNav
        : "Overview",
    );
    setSelectedProject(
      isDevFlowPage && typeof saved.selectedProject === "string"
        ? saved.selectedProject
        : null,
    );
    setSearch("");
    setTaskStatusFilter("All");
    setShowWorkspaceMenu(false);
  };

  window.addEventListener("popstate", handleBrowserNavigation);

  return () => {
    window.removeEventListener("popstate", handleBrowserNavigation);
  };
}, []);


  const scopedTasks =
    activeNav === "My tasks"
      ? tasks.filter((task) => task.assignees.includes("AS"))
      : tasks;

  const filteredTasks = scopedTasks.filter((task) => {
    const matchesProject =
      activeNav !== "Projects" ||
      selectedProject === null ||
      task.project === selectedProject;

    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.project.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      taskStatusFilter === "All" ||
      task.status === taskStatusFilter;
      
    return matchesProject && matchesSearch && matchesStatus;
    
  });
  
  
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("devflow-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("devflow-theme", theme);
    } catch (error) {
      console.error("Could not save theme preference:", error);
    }
  }, [theme]);


  const completedCount = filteredTasks.filter(
    (task) => task.status === "Done",
  ).length;

  const inProgressCount = filteredTasks.filter(
    (task) => task.status === "In progress",
  ).length;

  const completionRate =
    filteredTasks.length > 0
      ? Math.round(
          (completedCount / filteredTasks.length) * 100
        )
      : 0;

  const metrics: {
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
    tone: string;
  }[] = [
    {
      label: "Total tasks",
      value: String(filteredTasks.length),
      note: "Across your projects",
      icon: ListTodo,
      tone: "violet",
    },
    {
      label: "In progress",
      value: String(inProgressCount),
      note: "Currently being worked on",
      icon: Activity,
      tone: "blue",
    },
    {
      label: "Completed",
      value: String(completedCount),
      note: "Ready for review",
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Completion rate",
      value: `${completionRate}%`,
      note: "Of current tasks",
      icon: Zap,
      tone: "orange",
    },
  ];



async function handleAuthenticated(user: User): Promise<void> {
  taskLoadPromise = null;

  setCurrentUser(user);
  setApiError(null);
  setProjectError(null);
  setIsLoadingTasks(true);
  setIsLoadingProjects(true);

  try {
    const [loadedTasks, loadedProjects] = await Promise.all([
      loadTasksWithMigration(),
      fetchProjects(),
    ]);

    setTasks(loadedTasks);
    setProjects(loadedProjects);
    if (loadedProjects.length > 0) {
      setNewTaskProject((current) =>
        loadedProjects.some((project) => project.name === current)
          ? current
          : loadedProjects[0].name,
      );
    }
  } catch (error) {
    setApiError(
      error instanceof Error
        ? error.message
        : "Could not load your workspace.",
    );
  } finally {
    setIsLoadingTasks(false);
    setIsLoadingProjects(false);
  }
}


async function handleLogout() {
  try {
    await logoutRequest();

    taskLoadPromise = null;
    setCurrentUser(null);
    setTasks([]);
    setProjects([]);
    setSearch("");
    setApiError(null);
  } catch (error) {
    setApiError(
      error instanceof Error
        ? error.message
        : "Could not log out.",
    );
  }
}


async function handleSaveProject(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const trimmedName = projectName.trim();
  const trimmedDescription = projectDescription.trim();

  if (trimmedName.length < 2) {
    setProjectError("Project name must contain at least 2 characters.");
    return;
  }

  setProjectSaving(true);
  setProjectError(null);

  const payload: ProjectInput = {
    name: trimmedName,
    description: trimmedDescription,
    accent: projectAccent,
  };

  try {
    if (editingProject) {
      await updateProjectRequest(editingProject.id, payload);
    } else {
      await createProjectRequest(payload);
    }

    const [updatedProjects, updatedTasks] = await Promise.all([
      fetchProjects(),
      fetchTasks(),
    ]);

    setProjects(updatedProjects);
    setTasks(updatedTasks);

    if (editingProject && newTaskProject === editingProject.name) {
      setNewTaskProject(trimmedName);
    }

    if (editingProject) {
      const nextSelectedProject =
        selectedProject === editingProject.name ? trimmedName : selectedProject;
      replaceCurrentPage("Projects", nextSelectedProject);
    } else {
      navigateToPage("Projects", null);
    }

    setProjectName("");
    setProjectDescription("");
    setProjectAccent("purple");
    setEditingProject(null);
    setShowProjectModal(false);
  } catch (error) {
    setProjectError(
      error instanceof Error ? error.message : "Could not save project.",
    );
  } finally {
    setProjectSaving(false);
  }
}

async function handleDeleteProject(project: Project) {
  const confirmed = window.confirm(
    `Delete "${project.name}"? Its tasks will be kept and moved to Unassigned.`,
  );
  if (!confirmed) return;

  setProjectError(null);
  try {
    await deleteProjectRequest(project.id);
    const [updatedProjects, updatedTasks] = await Promise.all([
      fetchProjects(),
      fetchTasks(),
    ]);
    setProjects(updatedProjects);
    setTasks(updatedTasks);
    if (newTaskProject === project.name) {
      setNewTaskProject(updatedProjects[0]?.name ?? "");
    }

    if (selectedProject === project.name) {
      replaceCurrentPage("Projects", null);
    }
  } catch (error) {
    setProjectError(
      error instanceof Error ? error.message : "Could not delete project.",
    );
  }
}

async function changeTaskStatus(id: number, status: TaskStatus) {
  setApiError(null);

  try {
    const updatedTask = await updateTaskStatusRequest(id, status);

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );
  } catch (error) {
    setApiError(
      error instanceof Error
        ? error.message
        : "Could not update the task.",
    );
  }
}


  function openTaskModal(status: TaskStatus = "To do") {
    setEditingTask(null);
    setTaskError(null);
    setNewTaskTitle("");
    setNewTaskDue("No date");
    setNewTaskPriority("Medium");
    setNewTaskProject(selectedProject ?? projects[0]?.name ?? "");
    setNewTaskStatus(status);
    setShowTaskModal(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setProjectAccent(project.accent);
    setProjectError(null);
    setShowProjectModal(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskError(null);
    setNewTaskTitle(task.title);
    setNewTaskProject(task.project);
    setNewTaskStatus(task.status);
    setNewTaskPriority(task.priority);
    setNewTaskDue(task.due || "No date");
    setShowTaskModal(true);
  }

  async function saveTaskEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) return;

    const title = newTaskTitle.trim();
    if (!title) {
      setTaskError("Task name is required.");
      return;
    }

    setTaskSaving(true);
    setTaskError(null);

    try {
      const updatedTask = await updateTaskRequest(editingTask.id, {
        title,
        project: newTaskProject,
        status: newTaskStatus,
        priority: newTaskPriority,
        due: newTaskDue.trim() || "No date",
      });

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskError(null);
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Could not update task.",
      );
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setApiError(null);
    try {
      await deleteTaskRequest(task.id);
      setTasks((previousTasks) =>
        previousTasks.filter((item) => item.id !== task.id),
      );
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Could not delete task.",
      );
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const title = newTaskTitle.trim();

  if (!title) {
    setTaskError("Task name is required.");
    return;
  }

  setTaskSaving(true);
  setTaskError(null);
  setApiError(null);

  try {
    const savedTask = await createTaskRequest({
      title,
      project: newTaskProject,
      status: newTaskStatus,
      priority: newTaskPriority,
      due: newTaskDue.trim() || "No date",
    });

    setTasks((previousTasks) => [...previousTasks, savedTask]);

    navigateToPage("Overview");
    setNewTaskTitle("");
    setNewTaskDue("No date");
    setNewTaskProject(projects[0]?.name ?? "");
    setNewTaskStatus("To do");
    setNewTaskPriority("Medium");
    setShowTaskModal(false);
  } catch (error) {
    setTaskError(
      error instanceof Error
        ? error.message
        : "Could not create the task.",
    );
  } finally {
    setTaskSaving(false);
  }
}


  

const pageTitle =
  activeNav === "Settings"
    ? "Workspace settings"
    : selectedProject
      ? selectedProject
      : activeNav === "My tasks"
        ? "Your tasks, in flow."
        : activeNav === "Projects"
          ? "Projects in motion."
          : "Your work, in flow.";

const pageSubtitle =
  activeNav === "Settings"
    ? "Manage your account and personalize your workspace."
    : selectedProject
      ? "Manage and track tasks in this project."
      : activeNav === "My tasks"
        ? "A focused view of the work assigned to you."
        : activeNav === "Projects"
          ? "Explore your projects and track their progress."
          : "A little clarity goes a long way. Here's your workspace.";

  
if (isAuthLoading) {
  return (
    <div className="auth-loading-screen">
      Checking your session...
    </div>
  );
}

if (!currentUser) {
  return <AuthPage onAuthenticated={handleAuthenticated} />;
}

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          aria-label="DevFlow home"
          onClick={(event) => {
            event.preventDefault();
            navigateToPage("Overview");
          }}
        >
          <span className="brand-mark">
            <Sparkles size={21} />
          </span>
          <span className="brand-name">
            devflow<span>.</span>
          </span>
        </a>

       
<div className="workspace-switch-wrapper">
  <button
    type="button"
    className="workspace-switch"
    onClick={() => setShowWorkspaceMenu((previous) => !previous)}
    aria-expanded={showWorkspaceMenu}
  >
    <span className="workspace-logo">
      {currentUser?.name?.charAt(0).toUpperCase() || "A"}
    </span>

    <span className="workspace-copy">
      <strong>
        {currentUser ? `${currentUser.name}'s workspace` : "My workspace"}
      </strong>
      <small>Personal workspace</small>
    </span>

    <ChevronDown size={16} className="workspace-chevron" />
  </button>

  {showWorkspaceMenu && (
    <div className="workspace-menu">
      <div className="workspace-menu-heading">
        <small>CURRENT WORKSPACE</small>
        <strong>Personal workspace</strong>
      </div>

      <div className="workspace-current">
        <span className="workspace-current-icon">✓</span>
        <span>
          <strong>
            {currentUser?.name || "Your account"}
          </strong>
          <small>Current workspace owner</small>
        </span>
      </div>

      <div className="workspace-menu-divider" />

      <button
        type="button"
        className="workspace-menu-settings"
        onClick={() => {
          navigateToPage("Settings");
          setShowWorkspaceMenu(false);
        }}
      >
        <Settings size={16} />
        Workspace settings
        <ArrowUpRight size={14} />
      </button>

      <div className="workspace-menu-note">
        Team workspaces and switching are coming in a future update.
      </div>
    </div>
  )}
</div>


        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-link ${
                  activeNav === item.label ? "active" : ""
                }`}
                onClick={() => navigateToPage(item.label)}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.label === "My tasks" && (
                  <span className="nav-count">
                    {tasks.filter((task) =>
                      task.assignees.includes("AS"),
                    ).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

       
<div className="sidebar-section-label projects">
  <span>YOUR PROJECTS</span>

  <button
    type="button"
    className="add-project-button"
    title="Create new project"
    aria-label="Create new project"
    onClick={() => {
      setProjectError(null);
      setEditingProject(null);
      setProjectName("");
      setProjectDescription("");
      setProjectAccent("purple");
      setShowProjectModal(true);
    }}
  >
    <Plus size={16} />
  </button>
</div>

          
{isLoadingProjects && (
  <p className="project-message">Loading projects...</p>
)}

{projectError && (
  <p className="project-error" role="alert">
    {projectError}
  </p>
)}

{!isLoadingProjects && projects.length === 0 && (
  <p className="project-message">
    No projects yet. Create your first project!
  </p>
)}

        <div className="sidebar-project-list">
          {projects.map((project) => (
            <button
              key={project.id}
              className="sidebar-project"
              onClick={() => openProjectView(project.name)}
            >
              <span className={`project-symbol ${project.accent}`}>
                <FolderKanban size={15} />
              </span>
              <span>{project.name}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <div className="tip-icon">
            <Sparkles size={17} />
          </div>
          <strong>Small steps, big wins.</strong>
          <p>Every completed task moves your team forward.</p>
          <div className="tip-progress">
            <span style={{ width: `${completionRate}%` }} />
          </div>
          <small>{completionRate}% of your tasks completed</small>
        </div>

        
      <button
        className={`sidebar-settings ${
          activeNav === "Settings" ? "active" : ""
        }`}
        onClick={() => navigateToPage("Settings")}
      >
        <Settings size={18} />
        <span>Workspace settings</span>
      </button>


        <div className="profile-row">
          <div className="profile-avatar">
            {getUserInitials(currentUser.name)}
          </div>
          <div className="profile-copy">
            <strong>{currentUser.name}</strong>
            <small>Personal workspace</small>
          </div>
          
          <button
            className="icon-button profile-menu"
            title="Log out"
            aria-label="Log out"
            onClick={handleLogout}
          >
          <LogOut size={16} />
          </button>

        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <label className="global-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks and projects"
              />
              <kbd> / </kbd>
            </label>

            
            <button
              className="icon-button theme-toggle"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={() =>
                setTheme((previous) => previous === "light" ? "dark" : "light")
              }
            >
              {theme === "light" ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
            </button>


            <div className="notification-wrapper">
              <button
                className="icon-button notification-button"
                title="Notifications"
                aria-label="Toggle notifications"
                onClick={() =>
                  setShowNotifications(!showNotifications)
                }
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>

              {showNotifications && (
                <div className="notification-popover">
                  <div className="notification-heading">
                    <strong>Notifications</strong>
                    <button
                      className="icon-button tiny"
                      onClick={() => setShowNotifications(false)}
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="notification-empty">
                    <span className="notification-empty-icon">
                      <Bell size={21} />
                    </span>
                    <strong>You're all caught up</strong>
                    <p>
                      New updates will appear here as your workspace grows.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-avatar">
              {getUserInitials(currentUser.name)}
            </div>
          </div>
        </header>

        
{isLoadingTasks && (
  <div className="api-loading">
    Loading your tasks from PostgreSQL...
  </div>
)}

{apiError && (
  <div className="api-alert" role="alert">
    {apiError}
  </div>
)}


        <div className={`dashboard-container ${
          activeNav === "Settings" ? "settings-active" : ""
        }`}>
          <section className="welcome-section">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR WORKSPACE AT A GLANCE
              </div>
              <h1>{pageTitle}</h1>
              <p>{pageSubtitle}</p>
            </div>

            <button
              className="primary-button"
              onClick={() => openTaskModal()}
            >
              <Plus size={18} />
              New task
            </button>
          </section>
          
{activeNav === "Settings" && (
  <section className="settings-page">

    <div className="settings-page-heading">
      <h2>Personalize your experience</h2>
      <p>Manage your profile and workspace preferences.</p>
    </div>

    <div className="settings-grid">

      {/* Account information */}
      <article className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon purple">
            <Users size={20} />
          </div>
          <div>
            <h3>Account information</h3>
            <p>Your registered account details</p>
          </div>
        </div>

        <div className="settings-detail">
          <span>Full name</span>
          <strong>{currentUser?.name || "User"}</strong>
        </div>

        <div className="settings-detail">
          <span>Email address</span>
          <strong>{currentUser?.email || "Not available"}</strong>
        </div>

        <div className="settings-detail">
          <span>Account status</span>
          <strong className="account-status">Active</strong>
        </div>
      </article>

      {/* Appearance settings */}
      <article className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon orange">
            <Sun size={20} />
          </div>
          <div>
            <h3>Appearance</h3>
            <p>Choose your preferred visual theme</p>
          </div>
        </div>

        <div className="theme-options">

          <button
            className={`theme-option ${
              theme === "light" ? "selected" : ""
            }`}
            onClick={() => setTheme("light")}
          >
            <Sun size={21} />
            <strong>Light</strong>
            <span>Bright and clean</span>
            {theme === "light" && (
              <CheckCircle2 size={17} className="theme-check" />
            )}
          </button>

          <button
            className={`theme-option ${
              theme === "dark" ? "selected" : ""
            }`}
            onClick={() => setTheme("dark")}
          >
            <Moon size={21} />
            <strong>Dark</strong>
            <span>Easy on the eyes</span>
            {theme === "dark" && (
              <CheckCircle2 size={17} className="theme-check" />
            )}
          </button>

        </div>
      </article>

      {/* Workspace information */}
      <article className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon green">
            <FolderKanban size={20} />
          </div>
          <div>
            <h3>Workspace</h3>
            <p>Your current workspace information</p>
          </div>
        </div>

        <div className="settings-detail">
          <span>Workspace name</span>
          <strong>Acme Creative</strong>
        </div>

        <div className="settings-detail">
          <span>Workspace type</span>
          <strong>Personal workspace</strong>
        </div>

        <div className="settings-detail">
          <span>Task management</span>
          <strong>PostgreSQL connected</strong>
        </div>
      </article>

      {/* Application information */}
      <article className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon blue">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>About DevFlow</h3>
            <p>Application information</p>
          </div>
        </div>

        <div className="settings-detail">
          <span>Application</span>
          <strong>DevFlow</strong>
        </div>

        <div className="settings-detail">
          <span>Version</span>
          <strong>0.1.0</strong>
        </div>

        <div className="settings-detail">
          <span>Platform</span>
          <strong>Full-stack web application</strong>
        </div>
      </article>

    </div>
  </section>
)}

          {((activeNav !== "Projects" && activeNav !== "Settings") || selectedProject !== null) && (
          <section className="metrics-grid" aria-label="Task statistics">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <article
                  className="metric-card"
                  key={metric.label}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="metric-card-top">
                    <span className="metric-label">{metric.label}</span>
                    <span className={`metric-icon ${metric.tone}`}>
                      <Icon size={19} />
                    </span>
                  </div>
                  <div className="metric-value">{metric.value}</div>
                  <div className="metric-note">{metric.note}</div>
                  <div className="metric-bottom-line" />
                </article>
              );
            })}
          </section>
          )}
            {(activeNav === "Overview" ||
              (activeNav === "Projects" && selectedProject === null)) && (
            
          <section className="projects-section">
            <div className="section-heading">
              <div>
                <h2>Projects overview</h2>
                <p>Keep the bigger picture in view.</p>
              </div>
              <button
                className="text-button"
                onClick={openProjectsCollection}
              >
                View projects <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="project-overview-grid">
              {projects.map((project) => {
                const projectTasks = tasks.filter(
                  (task) => task.project === project.name,
                );
                const done = projectTasks.filter(
                  (task) => task.status === "Done",
                ).length;
                const progress = projectTasks.length > 0
                  ? Math.round((done / projectTasks.length) * 100)
                  : 0;

                return (
                  <article className="project-overview-card" key={project.id}>
                    <div className="project-overview-top">
                      <span className={`project-symbol large ${project.accent}`}>
                        <FolderKanban size={18} />
                      </span>
                      <span className="project-open-icon">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>

                    <h3>{project.name}</h3>
                    <p>{project.description || "No description added yet."}</p>

                    <div className="project-progress-row">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="progress-track">
                      <span
                        className={project.accent}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="project-overview-footer">
                      <span>
                        <ListTodo size={14} />
                        {projectTasks.length} tasks
                      </span>
                      <span>{done} completed</span>
                    </div>

                    <div className="project-card-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => openProjectView(project.name)}
                      >
                        Open project
                      </button>
                      <button
                        type="button"
                        className="icon-button tiny"
                        title={`Edit ${project.name}`}
                        aria-label={`Edit ${project.name}`}
                        onClick={() => openEditProject(project)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button tiny"
                        title={`Delete ${project.name}`}
                        aria-label={`Delete ${project.name}`}
                        onClick={() => void handleDeleteProject(project)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
              )}
            {(activeNav === "Overview" ||
              activeNav === "My tasks" ||
              (activeNav === "Projects" && selectedProject !== null)) && (
          <section className="board-section">
            <div className="section-heading board-heading">
              <div>
                <div className="board-title-row">
                  <h2>Task board</h2>
                  <span className="board-total">{filteredTasks.length}</span>
                </div>
                <p>From first idea to final delivery.</p>
              </div>

              <div className="board-actions">
                <label className="board-filter task-filter-control">
  <SlidersHorizontal size={16} />

  <select
    value={taskStatusFilter}
    onChange={(event) =>
      setTaskStatusFilter(
        event.target.value as "All" | TaskStatus
      )
    }
    aria-label="Filter tasks by status"
  >
    <option value="All">All tasks</option>
    <option value="To do">To do</option>
    <option value="In progress">In progress</option>
    <option value="Done">Done</option>
  </select>
</label>

              </div>
            </div>

            {search && (
              <div className="search-result-note">
                <Search size={14} />
                Showing results for <strong>"{search}"</strong>
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="kanban-board">
              {columns.map((column) => {
                const ColumnIcon = column.icon;
                const columnTasks = filteredTasks.filter(
                  (task) => task.status === column.title,
                );

                return (
                  <div
                    className={`kanban-column column-${column.id}`}
                    key={column.id}
                  >
                    <div className="column-header">
                      <div className="column-title-group">
                        <span className={`column-status-icon ${column.id}`}>
                          <ColumnIcon size={15} />
                        </span>
                        <h3>{column.title}</h3>
                        <span className="column-count">
                          {columnTasks.length}
                        </span>
                      </div>
                      <button
                        className="icon-button tiny"
                        title={`Add task to ${column.title}`}
                        onClick={() => openTaskModal(column.title)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="column-task-list">
                      {columnTasks.length > 0 ? (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onView={setViewingTask}
                            onEdit={openEditTask}
                            onDelete={handleDeleteTask}
                          />
                        ))
                      ) : (
                        <div className="empty-column">
                          <Sparkles size={19} />
                          <p>No tasks here yet.</p>
                          <button
                            onClick={() => openTaskModal(column.title)}
                          >
                            Add a task
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      className="add-task-inline"
                      onClick={() => openTaskModal(column.title)}
                    >
                      <Plus size={16} /> Add a task
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredTasks.length === 0 && (
              <div className="no-search-results">
                <Search size={22} />
                <h3>No matching tasks</h3>
                <p>Try another search term or clear your search.</p>
                <button
                  className="text-button"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              </div>
            )}
          </section>
              )}

          <footer className="dashboard-footer">
            <span>
              <Sparkles size={14} /> Made for focused teamwork.
            </span>
            <span>DevFlow <span className="footer-divider">·</span> v0.1</span>
          </footer>
        </div>
      </main>

      {viewingTask && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingTask(null);
          }}
        >
          <section
            className="task-modal task-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">TASK DETAILS</span>
                <h2 id="task-details-title">{viewingTask.title}</h2>
                <p>Here is the current information for this task.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setViewingTask(null)}
                aria-label="Close task details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="task-details-grid">
              <div className="task-detail-item">
                <span>Project</span>
                <strong>{viewingTask.project}</strong>
              </div>
              <div className="task-detail-item">
                <span>Status</span>
                <strong>{viewingTask.status}</strong>
              </div>
              <div className="task-detail-item">
                <span>Priority</span>
                <strong>{viewingTask.priority}</strong>
              </div>
              <div className="task-detail-item">
                <span>Due date</span>
                <strong>{viewingTask.due || "No date"}</strong>
              </div>
              <div className="task-detail-item">
                <span>Assigned to</span>
                <strong>
                  {viewingTask.assignees.length > 0
                    ? viewingTask.assignees.join(", ")
                    : "Not assigned"}
                </strong>
              </div>
              <div className="task-detail-item">
                <span>Activity</span>
                <strong>
                  {viewingTask.comments} comments · {viewingTask.files} attachments
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewingTask(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  openEditTask(viewingTask);
                  setViewingTask(null);
                }}
              >
                <Pencil size={15} /> Edit task
              </button>
            </div>
          </section>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-backdrop">
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">MAKE IT HAPPEN</span>
                <h2 id="task-modal-title">
                  {editingTask ? "Edit task" : "Create a new task"}
                </h2>
                <p>
                  {editingTask
                    ? "Update the details of this task."
                    : "Small steps turn plans into progress."}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                  setTaskError(null);
                }}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={editingTask ? saveTaskEdits : createTask}
            >
              <label htmlFor="task-title-input">Task name</label>
              <input
                id="task-title-input"
                autoFocus
                required
                maxLength={120}
                placeholder="e.g. Build the login page"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
              />

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="task-project-input">Project</label>
                  <select
                    id="task-project-input"
                    value={newTaskProject}
                    onChange={(event) =>
                      setNewTaskProject(event.target.value)
                    }
                  >
                    {projectNames.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                    {newTaskProject === "Unassigned" && (
                      <option value="Unassigned">Unassigned</option>
                    )}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="task-priority-input">Priority</label>
                  <select
                    id="task-priority-input"
                    value={newTaskPriority}
                    onChange={(event) =>
                      setNewTaskPriority(event.target.value as Priority)
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <label htmlFor="task-status-input">Starting status</label>
              <select
                id="task-status-input"
                value={newTaskStatus}
                onChange={(event) =>
                  setNewTaskStatus(event.target.value as TaskStatus)
                }
              >
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>

              <label htmlFor="task-due-input">Due date</label>
              <input
                id="task-due-input"
                type="text"
                maxLength={80}
                placeholder="e.g. Nov 10 or No date"
                value={newTaskDue}
                onChange={(event) => setNewTaskDue(event.target.value)}
              />

              {taskError && (
                <div className="api-alert" role="alert">
                  {taskError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                    setTaskError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={taskSaving}
                >
                  {taskSaving
                    ? (editingTask ? "Saving..." : "Creating...")
                    : editingTask
                      ? "Save changes"
                      : <><Plus size={17} /> Create task</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showProjectModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProjectModal(false);
              setEditingProject(null);
            }
          }}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">PROJECT WORKSPACE</span>
                <h2 id="project-modal-title">
                  {editingProject ? "Edit project" : "Create a new project"}
                </h2>
                <p>
                  {editingProject
                    ? "Update the details for this project."
                    : "Give your next idea a place to grow."}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                aria-label="Close project dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form className="task-form" onSubmit={handleSaveProject}>
              <label htmlFor="project-name-input">Project name</label>
              <input
                id="project-name-input"
                type="text"
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. AI Portfolio Website"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />

              <label htmlFor="project-description-input">Description</label>
              <textarea
                id="project-description-input"
                rows={3}
                maxLength={250}
                placeholder="What is this project about?"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
              />

              <label htmlFor="project-accent-input">Project colour</label>
              <select
                id="project-accent-input"
                value={projectAccent}
                onChange={(event) =>
                  setProjectAccent(event.target.value as ProjectInput["accent"])
                }
              >
                <option value="purple">Purple</option>
                <option value="green">Green</option>
                <option value="orange">Orange</option>
              </select>

              {projectError && (
                <div className="api-alert" role="alert">
                  {projectError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setProjectError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={projectSaving}
                >
                  {projectSaving
                    ? "Saving..."
                    : editingProject
                      ? "Save changes"
                      : "Create project"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </div>
  );
}

export default App;
