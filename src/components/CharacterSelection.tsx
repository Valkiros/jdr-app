import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { CharacterSummary } from "../types";
import { supabase } from "../lib/supabase";

interface CharacterSelectionProps {
    onSelect: (id: string) => void;
}

export function CharacterSelection({ onSelect }: CharacterSelectionProps) {
    const [historyData, setHistoryData] = useState<{ id: string, name: string, versions: { version_id: number, saved_at: string }[] } | null>(null);
    const [characters, setCharacters] = useState<CharacterSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

    useEffect(() => {
        loadCharacters();
    }, []);

    const loadCharacters = async () => {
        try {
            setLoading(true);
            const data = await invoke<CharacterSummary[]>("get_all_personnages");
            setCharacters(data);
            setError(null);
            checkSync();
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    const checkSync = async () => {
        try {
            const { data: cloudChars, error } = await supabase
                .from('personnages')
                .select('id, nom, updated_at');

            if (error) return; // Silent fail on offline

            if (cloudChars) {
                // Logic to just notify or badge could go here
                // For now we just implement the manual buttons request
            }
        } catch (e) { /* ignore */ }
    };

    const handleCloudUpload = async (id: string, name: string) => {
        setLoading(true);
        try {
            const charData = await invoke<any>("get_personnage", { id });
            if (!charData) throw new Error("Impossible de lire les données locales");

            const payload = {
                id: charData.id,
                nom: name,
                data: charData.data,
                updated_at: charData.updated_at
            };

            const { error } = await supabase.from('personnages').upsert(payload);
            if (error) throw error;

            showToast("Sauvegarde Cloud réussie !", 'success');
        } catch (err) {
            showToast("Erreur sauvegarde Cloud: " + String(err), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (id: string, name: string) => {
        try {
            const versions = await invoke<{ version_id: number, saved_at: string }[]>("get_personnage_versions", { id });
            setHistoryData({ id, name, versions });
        } catch (err) {
            showToast("Impossible de charger l'historique : " + String(err), 'error');
        }
    };

    const handleRestore = async (charId: string, versionId: number) => {
        if (!window.confirm("Attention : Restaurer une version écrasera la version actuelle. Continuer ?")) {
            return;
        }
        try {
            setLoading(true);
            await invoke("restore_personnage_version", { id: charId, versionId });
            showToast("Version restaurée avec succès !", 'success');
            setHistoryData(null);
            loadCharacters();
        } catch (err) {
            showToast("Erreur restauration : " + String(err), 'error');
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        // ... existing loading ...
        return (
            <div className="flex items-center justify-center h-full text-leather">
                Chargement...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-8 max-w-4xl mx-auto relative">
            {/* ... Modal History ... */}
            {historyData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-parchment border-2 border-leather rounded-lg shadow-2xl p-6 max-w-md w-full m-4 relative">
                        <button
                            onClick={() => setHistoryData(null)}
                            className="absolute top-2 right-2 text-leather hover:text-red-700 font-bold"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-leather mb-4 border-b border-leather/30 pb-2">
                            Historique : {historyData.name}
                        </h3>
                        {historyData.versions.length === 0 ? (
                            <p className="text-leather/70 italic">Aucune ancienne version disponible.</p>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-auto">
                                {historyData.versions.map((v) => (
                                    <div key={v.version_id} className="flex justify-between items-center p-3 bg-white/50 rounded border border-leather/20 hover:bg-white/80 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-leather text-sm">
                                                {new Date(v.saved_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-leather/70">
                                                {new Date(v.saved_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(historyData.id, v.version_id)}
                                            className="px-3 py-1 bg-leather text-parchment text-xs font-bold rounded hover:bg-leather-dark transition-colors"
                                        >
                                            Restaurer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {toast && (
                // ... existing toast ...
                <div className={`fixed top-4 right-4 px-6 py-4 rounded shadow-xl z-50 animate-bounce flex items-center gap-2 font-bold
                    ${toast.type === 'success' ? 'bg-green-700 text-white' : ''}
                    ${toast.type === 'error' ? 'bg-red-700 text-white' : ''}
                    ${toast.type === 'info' ? 'bg-blue-700 text-white' : ''}`
                }>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    {toast.message}
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-leather">Choix du Personnage</h2>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
                    Erreur: {error}
                </div>
            )}

            {characters.length === 0 ? (
                // ... existing empty state ...
                <div className="text-center p-8 border-2 border-dashed border-leather rounded-lg bg-parchment bg-opacity-50">
                    <p className="text-xl text-leather mb-4">Aucun personnage trouvé.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((char) => (
                        <div
                            key={char.id}
                            className="bg-parchment border border-leather rounded p-6 relative hover:shadow-lg transition-transform duration-200 min-h-[150px] group"
                        >
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const yes = await ask("Êtes-vous sûr de vouloir supprimer ce personnage ? Cette action est irréversible.", {
                                        title: 'Confirmer la suppression',
                                        kind: 'warning'
                                    });

                                    if (yes) {
                                        invoke("delete_personnage", { id: char.id })
                                            .then(() => loadCharacters())
                                            .catch((err) => setError(String(err)));
                                    }
                                }}
                                className="absolute top-2 right-2 text-leather hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Supprimer"
                            >
                                ✕
                            </button>

                            {/* History Button (Top Left) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewHistory(char.id, char.name);
                                }}
                                className="absolute top-2 left-2 text-leather hover:text-blue-700 opacity-60 hover:opacity-100 transition-opacity p-1 text-sm flex items-center gap-1"
                                title="Historique des versions"
                            >
                                🕒 <span className="text-xs hidden group-hover:inline">Historique</span>
                            </button>

                            <div onClick={() => onSelect(char.id)} className="cursor-pointer h-full flex flex-col justify-between pt-6">
                                <div>
                                    <h3 className="text-xl font-bold text-leather mb-2">{char.name}</h3>
                                    <p className="text-sm text-leather opacity-75">
                                        Modifié le: {new Date(char.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloudUpload(char.id, char.name);
                                        }}
                                        className="text-xs font-bold text-blue-800 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                        title="Sauvegarder cette version sur le Cloud"
                                    >
                                        ☁️ Cloud
                                    </button>
                                    <span className="text-leather font-serif italic">Jouer →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Character Buttons... will be kept by replacement if I target correctly or include them */}
            <div className="mt-8 border-t border-leather pt-6">
                <h3 className="text-xl font-bold text-leather mb-4">Créer un nouveau personnage</h3>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            const name = prompt("Nom du personnage ?");
                            if (name) {
                                try {
                                    setLoading(true);
                                    const newId = await invoke<string>("create_personnage", { name });
                                    onSelect(newId);
                                } catch (err) {
                                    setError(String(err));
                                    setLoading(false);
                                }
                            }
                        }}
                        className="px-6 py-3 bg-leather-dark text-parchment font-bold rounded hover:bg-black transition-colors"
                    >
                        + Nouveau Personnage
                    </button>
                    {/* ... other buttons ... */}
                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                const newId = await invoke<string>("create_personnage", { name: "Nouveau Personnage" });
                                onSelect(newId);
                            } catch (err) {
                                setError(String(err));
                                setLoading(false);
                            }
                        }}
                        className="px-6 py-3 bg-leather text-parchment font-bold rounded hover:bg-leather-dark transition-colors"
                    >
                        Rapide
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                // 1. Fetch from Supabase
                                const { data: cloudChars, error } = await supabase
                                    .from('personnages')
                                    .select('*');

                                if (error) throw error;

                                if (!cloudChars || cloudChars.length === 0) {
                                    showToast("Aucun personnage trouvé sur le Cloud.", 'info');
                                } else {
                                    // 2. Import each into Local SQLite
                                    for (const char of cloudChars) {
                                        await invoke("import_personnage", {
                                            id: char.id,
                                            name: char.nom,
                                            data: JSON.stringify(char.data),
                                            updatedAt: char.updated_at
                                        });
                                    }
                                    // 3. Refresh list
                                    await loadCharacters();
                                    showToast(`${cloudChars.length} personnage(s) importé(s) !`, 'success');
                                }
                            } catch (err: any) {
                                setError(String(err.message || err));
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="px-6 py-3 bg-blue-700 text-white font-bold rounded hover:bg-blue-800 transition-colors flex items-center gap-2"
                    >
                        <span>☁️</span> Importer du Cloud
                    </button>
                </div >
            </div >
        </div >
    );
}
