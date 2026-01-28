import { useEffect, useState } from "react";
import "./index.css";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

import { CharacterSheet } from "./components/CharacterSheet";

import { CharacterSelection } from "./components/CharacterSelection";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      if (!session) {
        setSelectedCharacterId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedCharacterId(null);
  };

  if (!session) {
    return <Login />;
  }

  if (!selectedCharacterId) {
    return (
      <CharacterSelection
        onSelect={setSelectedCharacterId}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-parchment text-leather font-sans">
      <header className="p-4 bg-leather text-parchment shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">JDR Manager</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedCharacterId(null)}
            className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
          >
            Changer de personnage
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-parchment-pattern">
        <CharacterSheet characterId={selectedCharacterId} />
      </main>
    </div>
  );
}

export default App;
