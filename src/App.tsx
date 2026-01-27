import { useEffect, useState } from "react";
import "./index.css";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import { Session } from "@supabase/supabase-js";

import { Inventory } from "./components/Inventory";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen bg-parchment text-leather font-sans">
      <header className="p-4 bg-leather text-parchment shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">JDR Manager</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
        >
          Déconnexion
        </button>
      </header>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Inventory />
        </div>
      </main>
    </div>
  );
}

export default App;
