import React from 'react';
import { GeneralStats } from '../types';

interface GeneralStatsPanelProps {
    stats: GeneralStats;
    onChange: (stats: GeneralStats) => void;
}

export const GeneralStatsPanel: React.FC<GeneralStatsPanelProps> = ({ stats, onChange }) => {
    const handleChange = (field: keyof GeneralStats, value: string) => {
        onChange({ ...stats, [field]: parseInt(value) || 0 });
    };

    return (
        <div className="flex flex-wrap justify-between gap-4 p-4 my-2 bg-leather text-parchment rounded shadow-md">
            <div className="flex flex-col items-center">
                <label className="text-xs uppercase opacity-80 tracking-widest">Niveau</label>
                <input
                    type="number"
                    value={stats.niveau}
                    onChange={(e) => handleChange('niveau', e.target.value)}
                    className="w-16 bg-black/20 border border-parchment/30 rounded text-center text-xl font-bold p-1 focus:bg-black/40 outline-none"
                />
            </div>
            <div className="flex flex-col items-center">
                <label className="text-xs uppercase opacity-80 tracking-widest">Expérience</label>
                <input
                    type="number"
                    value={stats.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    className="w-24 bg-black/20 border border-parchment/30 rounded text-center text-xl font-bold p-1 focus:bg-black/40 outline-none"
                />
            </div>
            <div className="flex flex-col items-center">
                <label className="text-xs uppercase opacity-80 tracking-widest">Points de Destin</label>
                <input
                    type="number"
                    value={stats.points_destin}
                    onChange={(e) => handleChange('points_destin', e.target.value)}
                    className="w-16 bg-black/20 border border-parchment/30 rounded text-center text-xl font-bold p-1 focus:bg-black/40 outline-none"
                />
            </div>
            <div className="flex flex-col items-center text-red-300">
                <label className="text-xs uppercase opacity-80 tracking-widest">Malus Tête</label>
                <input
                    type="number"
                    value={stats.malus_tete}
                    onChange={(e) => handleChange('malus_tete', e.target.value)}
                    className="w-16 bg-red-900/30 border border-red-300/30 rounded text-center text-xl font-bold p-1 focus:bg-red-900/50 outline-none text-red-200"
                />
            </div>
        </div>
    );
};
