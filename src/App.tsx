import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getProfile, updateProfile } from "./services/api";
import { signOut } from "aws-amplify/auth";
import { Button, Card, Loader } from "@aws-amplify/ui-react";

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

  useEffect(() => {
    onGet();
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
            <h3>Hi, {profile.name}</h3>
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
              onClick={onReset}
              disabled={saving || !dirty}
              variation="link"
              style={{ width: "100px" }}
            >
              Reset
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

export default App;
