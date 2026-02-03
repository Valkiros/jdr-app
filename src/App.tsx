import { useEffect, useRef, useState } from "react";
import "./index.css";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

import { CharacterSheet, CharacterSheetHandle } from "./components/CharacterSheet";
import { CharacterSelection } from "./components/CharacterSelection";
import { ConfirmModal } from "./components/ConfirmModal";
import { UserProfile } from "./types";

import { AdminPanel } from "./components/AdminPanel"; // Import AdminPanel (to be created)

// ... (existing imports)

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [view, setView] = useState<'selection' | 'sheet' | 'admin'>('selection'); // New view state
  const [isDirty, setIsDirty] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const sheetRef = useRef<CharacterSheetHandle>(null);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      // Fetch user profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUserProfile(data as UserProfile);
      } else if (error) {
        console.error("Error fetching profile:", error);
      }
    };

    // Listens to auth changes (fires immediately with current session too)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      if (session) {
        // Only fetch if profile is missing or ID changed to avoid loops
        // Simple check for now: always fetch on auth change is safer than stale data
        fetchProfile(session.user.id);
      } else {
        setSelectedCharacterId(null);
        setUserProfile(null);
      }
    });


    // Window close warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Update view when character is selected/deselected
  useEffect(() => {
    if (selectedCharacterId) {
      setView('sheet');
    } else if (view !== 'admin') {
      setView('selection');
    }
  }, [selectedCharacterId]);

  const runWithCheck = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowConfirm(true);
    } else {
      action();
    }
  };

  const handleLogout = async () => {
    runWithCheck(async () => {
      await supabase.auth.signOut();
      setSelectedCharacterId(null);
      setView('selection');
      setIsDirty(false);
    });
  };

  const handleChangeCharacter = () => {
    runWithCheck(() => {
      setSelectedCharacterId(null);
      setView('selection');
      setIsDirty(false);
    });
  };

  const handleAdminView = () => {
    runWithCheck(() => {
      setSelectedCharacterId(null);
      setView('admin');
      setIsDirty(false);
    });
  };

  if (!session) {
    return <Login />;
  }

  // Render Logic based on View
  let content;
  if (view === 'admin') {
    content = <AdminPanel onBack={handleChangeCharacter} />;
  } else if (selectedCharacterId) {
    content = (
      <CharacterSheet
        ref={sheetRef}
        characterId={selectedCharacterId}
        onDirtyChange={setIsDirty}
      />
    );
  } else {
    content = (
      <CharacterSelection
        onSelect={(id) => { setSelectedCharacterId(id); }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-parchment text-leather font-sans overflow-hidden overscroll-none">
      <header className="p-4 bg-leather text-parchment shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">JDR Manager</h1>
          {userProfile && (
            <span className="px-2 py-1 bg-parchment text-leather text-xs font-bold rounded uppercase border border-leather/50">
              {userProfile.role}
            </span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <div id="header-actions"></div>

          {userProfile?.role === 'admin' && view !== 'admin' && (
            <button
              onClick={handleAdminView}
              className="px-3 py-1 bg-[#cca43b] text-leather-dark font-bold rounded text-sm hover:bg-[#eebb44] cursor-pointer"
            >
              Base de Données (Admin)
            </button>
          )}

          {view === 'sheet' && (
            <button
              onClick={handleChangeCharacter}
              className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
            >
              Changer de personnage
            </button>
          )}

          {view === 'admin' && (
            <button
              onClick={handleChangeCharacter}
              className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
            >
              Retour Accueil
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-parchment text-leather rounded text-sm hover:bg-white cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-parchment-pattern">
        {content}
      </main>


      <ConfirmModal
        isOpen={showConfirm}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non enregistrées. Que voulez-vous faire ?"
        onSaveAndContinue={async () => {
          if (sheetRef.current) {
            await sheetRef.current.save();
            pendingAction?.();
            setShowConfirm(false);
          }
        }}
        onConfirm={() => {
          pendingAction?.();
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="Quitter sans sauvegarder"
        saveLabel="Sauvegarder et Quitter"
      />
    </div>
  );
}

export default App;
