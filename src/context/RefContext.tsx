import React, { createContext, useContext, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GameRules } from '../types';

interface RefContextType {
    refs: any[];
    gameRules: GameRules | null;
    loading: boolean;
    error: string | null;
    reloadRefs: () => Promise<void>;
}

const RefContext = createContext<RefContextType>({
    refs: [],
    gameRules: null,
    loading: true,
    error: null,
    reloadRefs: async () => { }
});

export const RefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [refs, setRefs] = useState<any[]>([]);
    const [gameRules, setGameRules] = useState<GameRules | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRefData = async () => {
        try {
            setLoading(true);
            // Execute both fetches in parallel
            const [refData, rules] = await Promise.all([
                invoke('get_ref_items') as Promise<any[]>,
                invoke('get_game_rules') as Promise<GameRules>
            ]);

            setRefs(refData);
            setGameRules(rules);
            setLoading(false);
        } catch (err: any) {
            console.error("Failed to fetch reference data:", err);
            setError(err.message || "Erreur lors du chargement des données de référence");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefData();
    }, []);

    const reloadRefs = async () => {
        await fetchRefData();
    };

    return (
        <RefContext.Provider value={{ refs, gameRules, loading, error, reloadRefs }}>
            {children}
        </RefContext.Provider>
    );
};

export const useRefContext = () => useContext(RefContext);
