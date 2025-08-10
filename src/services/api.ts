import { fetchAuthSession } from "aws-amplify/auth";

// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL as string;

export async function getIdToken(): Promise<string | null> {
  const { tokens } = await fetchAuthSession();
  return tokens?.idToken?.toString() ?? null;
}

export async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken(); // from auth.ts
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: token, // REST authorizer
      // If you used HTTP API JWT Authorizer, use:
      // Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : await res.json();
}

export const getUsers = () => authed<any[]>("/profile");