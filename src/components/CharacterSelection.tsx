import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CharacterSummary } from "../types";

interface CharacterSelectionProps {
    onSelect: (id: string) => void;
    onLogout: () => void;
}

export function CharacterSelection({ onSelect, onLogout }: CharacterSelectionProps) {
    const [characters, setCharacters] = useState<CharacterSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCharacters();
    }, []);

    const loadCharacters = async () => {
        try {
            setLoading(true);
            const data = await invoke<CharacterSummary[]>("get_all_personnages");
            setCharacters(data);
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-leather">
                Chargement des personnages...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-leather">Choix du Personnage</h2>
                <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-leather text-parchment rounded hover:bg-opacity-90"
                >
                    Déconnexion
                </button>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
                    Erreur: {error}
                </div>
            )}

            {characters.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-leather rounded-lg bg-parchment bg-opacity-50">
                    <p className="text-xl text-leather mb-4">Aucun personnage trouvé.</p>
                    <div className="text-sm text-leather opacity-75">
                        (La création de personnage n'est pas encore implémentée)
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((char) => (
                        <div
                            key={char.id}
                            className="bg-parchment border border-leather rounded p-6 relative hover:shadow-lg transition-transform duration-200 min-h-[150px] group"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce personnage ? Cette action est irréversible.")) {
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

                            <div onClick={() => onSelect(char.id)} className="cursor-pointer h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-leather mb-2">{char.name}</h3>
                                    <p className="text-sm text-leather opacity-75">
                                        Modifié le: {new Date(char.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 text-right">
                                    <span className="text-leather font-serif italic">Jouer →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                </div>
            </div>
        </div>
    );
}
