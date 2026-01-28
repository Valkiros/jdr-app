import React from 'react';
import { Vitals, ValueMax, Corruption } from '../types';

interface VitalsPanelProps {
    vitals: Vitals;
    onChange: (vitals: Vitals) => void;
}

export const VitalsPanel: React.FC<VitalsPanelProps> = ({ vitals, onChange }) => {

    const handleValueMaxChange = (category: 'pv' | 'pm', field: keyof ValueMax, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...vitals,
            [category]: { ...vitals[category], [field]: num }
        });
    };

    const handleCorruptionChange = (field: keyof Corruption, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...vitals,
            corruption: { ...vitals.corruption, [field]: num }
        });
    };

    const renderBar = (label: string, data: ValueMax, category: 'pv' | 'pm', colorClass: string) => (
        <div className="flex flex-col gap-1 p-3 bg-parchment/40 rounded border border-leather/20">
            <h3 className="font-serif font-bold text-leather uppercase text-sm">{label}</h3>

            {/* Bar Visual */}
            <div className="w-full h-4 bg-gray-300 rounded overflow-hidden mb-2 border border-gray-400">
                <div
                    className={`h-full ${colorClass}`}
                    style={{ width: `${Math.min(100, (data.current / data.max) * 100)}%` }}
                />
            </div>

            {/* Inputs */}
            <div className="flex gap-2 text-center text-sm">
                <div className="flex flex-col w-1/3">
                    <label className="text-[10px] uppercase opacity-70">Actuel</label>
                    <input
                        type="number"
                        value={data.current}
                        onChange={(e) => handleValueMaxChange(category, 'current', e.target.value)}
                        className="bg-white/50 border border-leather/30 rounded px-1 w-full text-center"
                    />
                </div>
                <div className="flex flex-col w-1/3">
                    <label className="text-[10px] uppercase opacity-70">Max</label>
                    <input
                        type="number"
                        value={data.max}
                        onChange={(e) => handleValueMaxChange(category, 'max', e.target.value)}
                        className="bg-white/50 border border-leather/30 rounded px-1 w-full text-center"
                    />
                </div>
                <div className="flex flex-col w-1/3">
                    <label className="text-[10px] uppercase opacity-70">Add.</label>
                    <input
                        type="number"
                        value={data.temp}
                        onChange={(e) => handleValueMaxChange(category, 'temp', e.target.value)}
                        className="bg-white/50 border border-leather/30 rounded px-1 w-full text-center"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {renderBar('Points de Vie', vitals.pv, 'pv', 'bg-red-600')}
            {renderBar('Points de Mana', vitals.pm, 'pm', 'bg-blue-600')}

            {/* Corruption Section */}
            <div className="flex flex-col gap-1 p-3 bg-parchment/40 rounded border border-leather/20">
                <h3 className="font-serif font-bold text-purple-900 uppercase text-sm">Corruption</h3>

                {/* Bar Visual */}
                <div className="w-full h-4 bg-gray-300 rounded overflow-hidden mb-2 border border-gray-400 relative">
                    <div
                        className="h-full bg-purple-700"
                        style={{ width: `${Math.min(100, (vitals.corruption.current / 100) * 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold drop-shadow-md">
                        {vitals.corruption.current} / 100
                    </span>
                </div>

                <div className="flex gap-2 text-center text-sm">
                    <div className="flex flex-col w-1/2">
                        <label className="text-[10px] uppercase opacity-70">Actuel</label>
                        <input
                            type="number"
                            value={vitals.corruption.current}
                            onChange={(e) => handleCorruptionChange('current', e.target.value)}
                            className="bg-white/50 border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                    <div className="flex flex-col w-1/2">
                        <label className="text-[10px] uppercase opacity-70">Par Jour</label>
                        <input
                            type="number"
                            value={vitals.corruption.daily}
                            onChange={(e) => handleCorruptionChange('daily', e.target.value)}
                            className="bg-white/50 border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
