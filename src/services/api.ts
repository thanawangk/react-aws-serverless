import { fetchAuthSession } from "aws-amplify/auth";
import type { Profile } from "../App";

const BASE = import.meta.env.VITE_API_URL as string;

async function authHeader() {
  const { tokens } = await fetchAuthSession();
  const idToken = tokens?.idToken?.toString();
  if (!idToken) throw new Error("Not signed in");
  return { Authorization: idToken };
}

async function reqAuth<T>(path: string, init?: RequestInit): Promise<T> {
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

export const getProfile = () => reqAuth<Profile>("/profile");

export const updateProfile = (data: Partial<Profile>) =>
  reqAuth<{ message: string; profile: Profile }>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
