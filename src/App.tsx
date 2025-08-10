import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { getProfile, updateProfile } from "./services/profile";
import { signOut } from "aws-amplify/auth";

export type Profile = {
  userId?: string;
  email?: string;
  name?: string;
  createdAt?: string;
};

function App() {
  // const [profile, setProfile] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const load = async () => setProfile(await getUsers());
  // useEffect(() => {
  //   load().catch(console.error);
  // }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await getProfile();
        setProfile(p || {});
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    console.log(profile);
  }, [profile]);

  async function onSave() {
    try {
      setSaving(true);
      await updateProfile({ name: profile.name }); // send only changed fields
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      console.log("signing out");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={reactLogo} className="logo" alt="React logo" />
        </a>
      </div>

      <h1>HI</h1>
      <button onClick={handleSignOut}>Sign out</button>

      <div style={{ maxWidth: 480 }}>
        <h2>Profile</h2>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <label style={{ display: "block", marginTop: 12 }}>
          Name
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={profile.name ?? ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Your name"
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Email
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={profile.email ?? ""}
            readOnly
            placeholder="Email (from Cognito)"
          />
        </label>

        <button onClick={onSave} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}

export default App;
