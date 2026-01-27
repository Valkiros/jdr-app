import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { supabase } from '../lib/supabase';
import { Equipement, RefEquipement, FinalStats, BaseStats, Etats } from '../types';
import { EquipementTable } from './EquipementTable';

export const Inventory: React.FC = () => {
    const [stats, setStats] = useState<FinalStats>({
        esquive_totale: 0,
        esquive_naturelle: 10,
        bonus_equipement: 0,
        malus_poids: 0,
        malus_etats: 0
    });
    const [refs, setRefs] = useState<RefEquipement[]>([]);

    // Inventory Sections State
    const [mainsNues, setMainsNues] = useState<Equipement[]>([]);
    const [armes, setArmes] = useState<Equipement[]>([]);
    const [protections, setProtections] = useState<Equipement[]>([]);
    const [accessoires, setAccessoires] = useState<Equipement[]>([]);
    const [sacs, setSacs] = useState<Equipement[]>([]);

    useEffect(() => {
        // Fetch Reference Data from Supabase
        const fetchRefs = async () => {
            const { data, error } = await supabase
                .from('ref_items')
                .select('*')
                .range(0, 10000) // Increase limit to fetch all items (default is 1000)
                .order('category')
                .order('nom');

            if (error) {
                console.error("Failed to fetch equipment refs from Supabase:", error);
                return;
            }

            // Map Supabase rows to UI friendly format
            const mappedRefs: RefEquipement[] = (data || []).map((row: any) => ({
                id: row.id,
                ref_id: row.ref_id,
                category: row.category,
                nom: row.nom,
                // Extract basics from JSONBs for UI
                poids: parseFloat(row.details?.poids) || 0,
                esquive_bonus: parseInt(row.caracteristiques?.esquive) || 0,
                degats_pr: row.degats?.degats || (row.protections?.pr_sol ? `PR ${row.protections.pr_sol}` : "") || "",
                description: row.details?.effet || row.details?.description || "",
                raw: row // Keep full data accessible
            }));

            // console.log("🔥 Données reçues de Supabase:", mappedRefs);
            // console.log("🔍 Catégories trouvées:", [...new Set(mappedRefs.map(r => r.category))]);

            setRefs(mappedRefs);
        };

        fetchRefs();
    }, []);

    // Calculate Stats when inventory changes
    useEffect(() => {
        const allEquipments = [
            ...mainsNues,
            ...armes,
            ...protections,
            ...accessoires,
            ...sacs
        ];

        // Mock Base Stats & States for now (could lead to inputs later)
        const base: BaseStats = { esquive_naturelle: 10 };
        const etats: Etats = { fatigue: 0, alcool: 0, drogue: 0, blessure_tete: 0 };

        invoke<FinalStats>('compute_stats', {
            base,
            equipements: allEquipments,
            etats
        })
            .then(result => setStats(result))
            .catch(err => console.error("Failed to compute stats:", err));
    }, [mainsNues, armes, protections, accessoires, sacs]);

    return (
        <div className="p-6 min-h-screen text-ink">
            <header className="mb-8 border-b-2 border-leather pb-4 flex flex-col md:flex-row justify-between items-end gap-4">
                <h1 className="text-4xl font-serif font-bold text-ink-header drop-shadow-sm">Inventaire</h1>

                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold uppercase tracking-widest text-leather-light font-serif">Score d'Esquive</span>
                    <div className="flex items-center gap-4 text-lg">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-ink-light">Base</span>
                            <span className="font-bold">{stats.esquive_naturelle}</span>
                        </div>
                        <span className="text-ink-light">+</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-ink-light">Bonus</span>
                            <span className="font-bold text-green-700">{stats.bonus_equipement}</span>
                        </div>
                        <span className="text-ink-light">-</span>
                        <div className={`flex flex-col items-center ${stats.malus_poids > 0 ? 'text-red-700 font-bold' : ''}`}>
                            <div className="flex items-center gap-1">
                                {stats.malus_poids > 0 && (
                                    <span title="Poids excessif !" className="text-red-600 animate-pulse">⚠️</span>
                                )}
                                <span className="text-xs text-ink-light">Poids</span>
                            </div>
                            <span>{stats.malus_poids}</span>
                        </div>
                        <span className="text-ink-light">-</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-ink-light">États</span>
                            <span>{stats.malus_etats}</span>
                        </div>
                        <span className="text-ink-light">=</span>
                        <div className="text-5xl font-bold font-serif text-leather">
                            {stats.esquive_totale}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EquipementTable
                    title="Mains Nues"
                    type="Arme"
                    items={mainsNues}
                    onItemsChange={setMainsNues}
                    referenceOptions={refs.filter(r => r.category === 'Mains_nues' || r.category === 'Main nue')}
                />

                <EquipementTable
                    title="Armes"
                    type="Arme"
                    items={armes}
                    onItemsChange={setArmes}
                    referenceOptions={refs.filter(r => r.category === 'Armes')}
                />

                <EquipementTable
                    title="Protections"
                    type="Armure"
                    items={protections}
                    onItemsChange={setProtections}
                    referenceOptions={refs.filter(r => r.category === 'Protections')}
                />

                <EquipementTable
                    title="Accessoires"
                    type="Autre"
                    items={accessoires}
                    onItemsChange={setAccessoires}
                    referenceOptions={refs.filter(r => r.category === 'Accessoires')}
                />

                <EquipementTable
                    title="Sacs"
                    type="Sac"
                    items={sacs}
                    onItemsChange={setSacs}
                    referenceOptions={refs.filter(r => r.category === 'Sacs')}
                />
            </div>
        </div>
    );
};
