import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { signOut } from "aws-amplify/auth";
import { getUsers } from "./services/api";

function App() {
  const [profile, setProfile] = useState<any[]>([]);

  const load = async () => setProfile(await getUsers());

  useEffect(() => {
    load().catch(console.error);
    // console.log(profile);
  }, []);

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
      {/* <h4>{user?.signInDetails?.loginId}</h4> */}
      <button onClick={handleSignOut}>Sign out</button>
    </>
  );
}

export default App;
