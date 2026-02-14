import React, { useState } from 'react';
import { Movement, MagicStealth, ProtectionValue, StatDetail } from '../../../types';
import { Tooltip } from '../../Shared/Tooltip';
import { CalculationDetails } from './CalculationDetails';
import { SmartInput } from '../../Shared/SmartInput';


interface MovementPanelProps {
    movement: Movement;
    magic: MagicStealth;
    computedMovement?: {
        marche: { value: number, details: StatDetail },
        course: { value: number, details: StatDetail }
    };
    computedDiscretion?: { value: number, details: StatDetail };
    malusTete: number;
    onMovementChange: (movement: Movement) => void;
    onMagicChange: (magic: MagicStealth) => void;
    onMalusTeteChange: (value: number) => void;
}

const MovementPanelComponent: React.FC<MovementPanelProps> = ({ movement, magic, computedMovement, computedDiscretion, malusTete, onMovementChange, onMagicChange, onMalusTeteChange }) => {
    const [hoveredInfo, setHoveredInfo] = useState<{ details: StatDetail, x: number, y: number } | null>(null);

    const handleMovementChange = (category: keyof Movement, field: keyof ProtectionValue, value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value) || 0 : value;
        onMovementChange({
            ...movement,
            [category]: { ...movement[category], [field]: num }
        });
    };

    const handleMagicChange = (category: keyof MagicStealth, field: keyof ProtectionValue, value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value) || 0 : value;
        onMagicChange({
            ...magic,
            [category]: { ...magic[category], [field]: num }
        });
    };

    const renderMovementRow = (label: string, category: keyof Movement) => {
        const data = movement[category];

        let isComputed = false;
        let baseValue = data.base;
        let details: StatDetail | undefined;

        if (computedMovement) {
            if (category === 'marche') { baseValue = computedMovement.marche.value; details = computedMovement.marche.details; isComputed = true; }
            if (category === 'course') { baseValue = computedMovement.course.value; details = computedMovement.course.details; isComputed = true; }
        }

        return (
            <div className="flex items-center gap-1 mb-2">
                <label className="flex-1 text-sm font-bold text-leather leading-tight mr-1">{label}</label>
                <div className="flex flex-col items-center relative">
                    <span className="text-[10px] uppercase opacity-60">Base</span>
                    <div
                        className="relative"
                        onMouseEnter={(e) => {
                            if (isComputed && details) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredInfo({
                                    details,
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top
                                });
                            }
                        }}
                        onMouseLeave={() => setHoveredInfo(null)}
                    >
                        <SmartInput
                            type="number"
                            value={isComputed ? baseValue : (data.base || 0)}
                            onCommit={(val) => !isComputed && handleMovementChange(category, 'base', val)}
                            readOnly={isComputed}
                            className={`w-14 md:w-16 border border-leather/30 rounded text-center outline-none focus:border-leather ${isComputed ? 'bg-black/5 text-leather-dark cursor-help font-bold' : 'bg-input-bg'}`}
                        />
                    </div>
                </div>
                <span className="text-leather-light mt-4 px-1">+</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Add.</span>
                    <SmartInput
                        type="number"
                        value={data.temp || 0}
                        onCommit={(val) => handleMovementChange(category, 'temp', val)}
                        className="w-14 md:w-16 bg-input-bg border border-leather/30 rounded text-center outline-none focus:border-leather"
                    />
                </div>
                <span className="text-leather-light mt-4 px-1">=</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Total</span>
                    <span className="min-w-[2.5rem] w-auto px-2 py-1 font-bold text-center bg-leather/10 rounded my-auto block border border-leather/20">
                        {baseValue + (data.temp || 0)}
                    </span>
                </div>
            </div>
        );
    };

    const renderDiscretionRow = (label: string) => {
        const data = magic.discretion;
        const isComputed = computedDiscretion !== undefined;
        const baseValue = isComputed ? computedDiscretion.value : data.base;
        const details = isComputed ? computedDiscretion.details : undefined;

        return (
            <div className="flex items-center gap-1 mb-2">
                <label className="flex-1 text-sm font-bold text-leather leading-tight mr-1">{label}</label>
                <div className="flex flex-col items-center relative">
                    <span className="text-[10px] uppercase opacity-60">Base</span>
                    <div
                        className="relative"
                        onMouseEnter={(e) => {
                            if (isComputed && details) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredInfo({
                                    details,
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top
                                });
                            }
                        }}
                        onMouseLeave={() => setHoveredInfo(null)}
                    >
                        <SmartInput
                            type="number"
                            value={isComputed ? baseValue : (data.base || 0)}
                            onCommit={(val) => !isComputed && handleMagicChange('discretion', 'base', val)}
                            readOnly={isComputed}
                            className={`w-14 md:w-16 border border-leather/30 rounded text-center outline-none focus:border-leather ${isComputed ? 'bg-black/5 text-leather-dark cursor-help font-bold' : 'bg-input-bg'}`}
                        />
                    </div>
                </div>
                <span className="text-leather-light mt-4 px-1">+</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Add.</span>
                    <SmartInput
                        type="number"
                        value={data.temp || 0}
                        onCommit={(val) => handleMagicChange('discretion', 'temp', val)}
                        className="w-14 md:w-16 bg-input-bg border border-leather/30 rounded text-center outline-none focus:border-leather"
                    />
                </div>
                <span className="text-leather-light mt-4 px-1">=</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Total</span>
                    <span className="min-w-[2.5rem] w-auto px-2 py-1 font-bold text-center bg-leather/10 rounded my-auto block border border-leather/20">
                        {(baseValue || 0) + (data.temp || 0)}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 bg-parchment/30 rounded border border-leather/20 h-min">
            <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                Mouvement & Discrétion
            </h3>
            {renderMovementRow("Marche", "marche")}
            {renderMovementRow("Course", "course")}
            <div className="my-2 border-t border-leather/10"></div>
            {renderDiscretionRow("Discrétion")}

            <div className="mt-4 flex items-center justify-between border-t border-leather/10 pt-2 text-red-600">
                <label className="text-xs font-bold uppercase text-red-600/90">Malus Tête</label>
                <SmartInput
                    type="number"
                    value={malusTete || 0}
                    onCommit={(val) => onMalusTeteChange(Number(val))}
                    className="w-16 bg-input-bg border border-red-500/50 rounded text-center font-bold text-red-600 outline-none"
                />
            </div>

            <Tooltip visible={!!hoveredInfo} position={hoveredInfo ? { x: hoveredInfo.x, y: hoveredInfo.y } : { x: 0, y: 0 }} title="Détails du Calcul">
                {hoveredInfo && <CalculationDetails details={hoveredInfo.details} />}
            </Tooltip>
        </div>
    );
};
export const MovementPanel = React.memo(MovementPanelComponent);
