// import type { Profile } from "../App";
// import { authed } from "./api";

// // GET users
// export const getUsers = () => authed<Profile[]>("/profile");

import { fetchAuthSession } from "aws-amplify/auth";
import type { Profile } from "../App";

const BASE = import.meta.env.VITE_API_URL as string; // e.g. https://<api>.execute-api.<region>.amazonaws.com/production

async function authHeader() {
  const { tokens } = await fetchAuthSession();
  const idToken = tokens?.idToken?.toString();
  if (!idToken) throw new Error("Not signed in");
  // For REST v1 Cognito authorizer, try raw token first:
  return { Authorization: idToken };
  // If your authorizer expects Bearer:
  // return { Authorization: `Bearer ${idToken}` };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...(init || {}),
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export const getProfile = () => req<Profile>("/profile");

export const createProfile = (data: Partial<Profile>) =>
  req<{ message: string }>("/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProfile = (data: Partial<Profile>) =>
  req<{ message: string; profile: Profile }>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
