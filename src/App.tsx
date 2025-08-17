import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getProfile, updateProfile } from "./services/api";
import { signOut } from "aws-amplify/auth";
import { Button, Card, Loader } from "@aws-amplify/ui-react";
import type { Task } from "./types/task.type";
import { createTask, deleteTask, getTasks, updateTask } from "./services/task";

export type Profile = {
  userId?: string;
  email?: string;
  name?: string;
  createdAt?: string;
};

function App() {
  const [profile, setProfile] = useState<Profile>({});
  const [form, setForm] = useState<Profile>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const load = async () => setTasks(await getTasks());

  useEffect(() => {
    onGet();
    load().catch(console.error);
  }, []);

  // Set form with profile data
  useEffect(() => {
    setForm({
      name: profile.name ?? "",
      email: profile.email ?? "",
    });
  }, [profile]);

  async function onGet() {
    try {
      setLoading(true);
      const p = await getProfile();
      setProfile(p || {});
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const dirty = useMemo(() => {
    const currName = form.name ?? "";
    const savedName = profile.name ?? "";
    return currName !== savedName;
  }, [form.name, profile.name]);

  const canSave = useMemo(() => {
    const name = (form.name ?? "").trim();
    return dirty && !saving && !loading && name.length > 0;
  }, [dirty, saving, loading, form.name]);

  async function onSave() {
    if (!canSave) return;
    try {
      setSaving(true);
      setError(null);
      await updateProfile({ name: (form.name ?? "").trim() });
      onGet();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setForm({
      name: profile.name ?? "",
      email: profile.email ?? "",
    });
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  const add = async () => {
    if (!name.trim()) return;
    await createTask({ name: name.trim(), completed: false });
    setName("");
    await load();
  };

  const toggle = async (t: Task) => {
    await updateTask({ ...t, completed: !t.completed });
    await load();
  };

  const remove = async (id: string) => {
    await deleteTask(id);
    await load();
  };

  function useIsDesktop(breakpoint = 768) {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= breakpoint);
    useEffect(() => {
      const handler = () => setIsDesktop(window.innerWidth >= breakpoint);
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, [breakpoint]);
    return isDesktop;
  }

  const isDesktop = useIsDesktop();

  return (
    <>
      {loading ? (
        <Loader filledColor={"black"} width={"48px"} height={"48px"} />
      ) : (
        <Card
          variation="elevated"
          style={{
            borderRadius: "4px",
            padding: "8px 24px 40px 24px",
            margin: 0,
            textAlign: "center",
            minWidth: isDesktop ? "480px" : "auto",
          }}
        >
          <div className="header">
            <h2>Hi, {profile.name}</h2>
            <Button
              size="small"
              variation="primary"
              colorTheme="error"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>

          <div className="detail-list">
            {error && <p style={{ color: "crimson" }}>{error}</p>}

            <div className="detail-item">
              <label>Name</label>
              <input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Your name"
              />
            </div>

            <div className="detail-item">
              <label>Email</label>
              <input
                value={form.email ?? ""}
                readOnly
                placeholder="Email (Cognito)"
              />
            </div>
          </div>

          <div className="btn-group">
            <Button
              size="small"
              variation="primary"
              onClick={onSave}
              disabled={!canSave}
              style={{ marginRight: 16, width: "100px" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>

            <Button
              size="small"
              variation="link"
              onClick={onReset}
              disabled={saving || !dirty}
              style={{ width: "100px" }}
            >
              Reset
            </Button>
          </div>

          <div>
            <div className="header" style={{ marginBottom: 30 }}>
              <h2>Tasks</h2>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New task name"
                className="input-task"
              />
              <Button variation="primary" onClick={add}>
                Add
              </Button>
            </div>
            <ul>
              {tasks.map((t) => (
                <li
                  key={t.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggle(t)}
                  />
                  <span
                    style={{
                      textDecoration: t.completed ? "line-through" : "none",
                    }}
                  >
                    {t.name}
                  </span>
                  <Button
                    size="small"
                    variation="link"
                    colorTheme="error"
                    style={{ marginLeft: "auto" }}
                    onClick={() => remove(t.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </>
  );
}

export default App;
