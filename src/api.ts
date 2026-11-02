
export type TaskStatus = "To do" | "In progress" | "Done";
export type Priority = "High" | "Medium" | "Low";

export type User = {
  id: number;
  name: string;
  email: string;
};

export type Task = {
  id: number;
  title: string;
  project: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  assignees: string[];
  comments: number;
  files: number;
  accent: string;
};

export type CreateTaskInput = Pick<
  Task,
  "title" | "project" | "status" | "priority" | "due"
>;

// Local development talks directly to the Express server.
// In production, Vercel forwards same-origin /api requests to the backend project.
const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "/api";

// Common response helper
async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (${response.status})`,
    );
  }

  return data;
}

// TASK APIs

export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    credentials: "include",
  });

  return await readResponse(response) as Task[];
}

export async function createTaskRequest(
  task: CreateTaskInput,
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  return await readResponse(response) as Task;
}

export async function updateTaskStatusRequest(
  id: number,
  status: TaskStatus,
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return await readResponse(response) as Task;
}

export async function updateTaskRequest(
  id: number,
  task: CreateTaskInput,
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  return await readResponse(response) as Task;
}

export async function deleteTaskRequest(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await readResponse(response);
}

// AUTHENTICATION APIs

export async function registerRequest(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await readResponse(response);
  return result.user as User;
}

export async function loginRequest(data: {
  email: string;
  password: string;
}): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await readResponse(response);
  return result.user as User;
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const result = await readResponse(response);
  return result.user as User;
}

export async function logoutRequest(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  await readResponse(response);
}

export type Project = {
  id: number;
  name: string;
  description: string;
  accent: "purple" | "green" | "orange";
  total_tasks: number;
  completed_tasks: number;
};

export type ProjectInput = {
  name: string;
  description: string;
  accent: "purple" | "green" | "orange";
};

// GET: Load all projects
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    credentials: "include",
  });

  return await readResponse(response) as Project[];
}

// POST: Create project
export async function createProjectRequest(
  project: ProjectInput,
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  const result = await readResponse(response);
  return result.project as Project;
}

// PATCH: Edit project
export async function updateProjectRequest(
  id: number,
  project: ProjectInput,
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });

  const result = await readResponse(response);
  return result.project as Project;
}

// DELETE: Delete project
export async function deleteProjectRequest(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await readResponse(response);
}
