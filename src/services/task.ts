import type { Task } from "../types/task.type";

const BASE = import.meta.env.VITE_API_URL_TASK as string;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.status === 204 ? (undefined as T) : await res.json();
}

// GET /task  -> returns Task[]
export const getTasks = () => req<Task[]>("/task");

// POST /task {name, completed} -> returns {message: string}
export const createTask = (data: Pick<Task, "name" | "completed">) =>
  req<{ message: string }>("/task", {
    method: "POST",
    body: JSON.stringify(data),
  });

// PATCH /task {id, name, completed} -> returns {message, task}
export const updateTask = (data: Task) =>
  req<{ message: string; task: Task }>("/task", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// DELETE /task {id} -> returns {message, task}
export const deleteTask = (id: string) =>
  req<{ message: string; task: Task }>("/task", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
