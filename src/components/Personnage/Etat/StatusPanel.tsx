import { useEffect, useState } from 'react';
import { CharacterStatus } from '../../../types';


interface StatusPanelProps {
    status: CharacterStatus;
    description?: string;
    onChange: (status: CharacterStatus) => void;
    onDescriptionChange: (desc: string) => void;
}

import { SmartInput } from '../../Shared/SmartInput';

// Helper Components for local state management
// OnBlurInput removed in favor of SmartInput

// OnBlurTextArea removed in favor of SmartInput

export const StatusPanel: React.FC<StatusPanelProps> = ({ status, description = '', onChange, onDescriptionChange }) => {
    // Derived state for calculation display
    const [recoveryPreview, setRecoveryPreview] = useState({ pv: 0, pa: 0 });

    // Recalculate recovery preview whenever fatigue changes
    // Recalculate recovery preview whenever fatigue changes
    useEffect(() => {
        const { recuperation, nb_heure } = status.fatigue;

        let multiplierPV = 1;
        let multiplierPA = 1;

        // Logic adapted to new options
        if (recuperation && recuperation.includes('Excellente')) {
            multiplierPV = 1;
            multiplierPA = 4; // Exemple: récupère 2x plus de PA
        }
        if (recuperation && recuperation.includes('Normale')) {
            multiplierPV = 0.5;
            multiplierPA = 3;
        }
        if (recuperation && recuperation.includes('Basse')) {
            multiplierPV = 0.25;
            multiplierPA = 2;
        }

        const pv = Math.floor(nb_heure * multiplierPV);
        const pa = Math.floor(nb_heure * multiplierPA);

        setRecoveryPreview({ pv, pa });
    }, [status.fatigue]);


    const updateStatus = (section: keyof CharacterStatus, field: string, value: any) => {
        const newStatus = { ...status };
        (newStatus as any)[section] = {
            ...newStatus[section],
            [field]: value
        };
        onChange(newStatus);
    };

    const SENSE_OPTIONS: Record<string, string[]> = {
        vue: ['Surdéveloppée avec nyctalopie totale', 'Surdéveloppée avec nyctalopie moyenne', 'Surdéveloppée',
            'Développée avec nyctalopie totale', 'Développée avec nyctalopie moyenne', 'Développée',
            'Normale avec nyctalopie totale', 'Normale avec nyctalopie moyenne', 'Normale',
            'Faible avec nyctalopie totale', 'Faible avec nyctalopie moyenne', 'Faible',
            'Aveugle avec nyctalopie totale', 'Aveugle avec nyctalopie moyenne', 'Aveugle'
        ],
        ouie: ['Surdéveloppée', 'Développée', 'Normale', 'Mauvaise', 'Sourd', 'Ultrason'],
        odorat: ['Surdéveloppée', 'Développée', 'Normale', 'Mauvaise', 'Anosmique'],
        humectation: ['Sec', 'Mouillé', 'Trempé', 'Froid', 'Frigorifié', 'Desséché', 'Calciné']
    };

    const FATIGUE_OPTIONS = {
        etat: ['Reposé', 'Normal', 'Fatigué', 'Epuisé 1', 'Epuisé 2', 'Epuisé 3', 'Epuisé 4', 'Epuisé 5',
            'Epuisé 6', 'Epuisé 7', 'Epuisé 8', 'Epuisé 9', 'Epuisé 10'
        ],
        recuperation: ['Excellente', 'Normale', 'Basse']
    };

    return (
        <div className="space-y-8 pb-10 animate-fade-in relative">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* 1. SENS */}
                <div className="bg-parchment/30 p-6 rounded-lg shadow-sm border border-leather/20">
                    <h2 className="text-xl font-bold text-leather mb-4 border-b border-leather/20 pb-2">Sens</h2>
                    <div className="space-y-4">
                        {Object.entries(SENSE_OPTIONS).map(([sens, options]) => (
                            <div key={sens} className="flex flex-col">
                                <label className="text-[13px] font-bold uppercase text-leather-light mb-1">{sens}</label>
                                <select
                                    value={(status.senses as any)[sens]}
                                    onChange={(e) => updateStatus('senses', sens, e.target.value)}
                                    className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                                >
                                    {options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Sentir le danger à (m)</label>
                            <SmartInput
                                type="number"
                                value={status.senses.sentir_danger || 0}
                                onCommit={(val) => updateStatus('senses', 'sentir_danger', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. FATIGUE */}
                <div className="bg-parchment/30 p-6 rounded-lg shadow-sm border border-leather/20">
                    <h2 className="text-xl font-bold text-leather mb-4 border-b border-leather/20 pb-2">Fatigue</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">État de fatigue</label>
                            <select
                                value={status.fatigue.etat}
                                onChange={(e) => updateStatus('fatigue', 'etat', e.target.value)}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            >
                                {FATIGUE_OPTIONS.etat.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Qualité de récupération</label>
                            <select
                                value={status.fatigue.recuperation}
                                onChange={(e) => updateStatus('fatigue', 'recuperation', e.target.value)}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            >
                                {FATIGUE_OPTIONS.recuperation.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Nombre d'heures</label>
                            <SmartInput
                                type="number"
                                min={0}
                                value={status.fatigue.nb_heure || 0}
                                onCommit={(val) => updateStatus('fatigue', 'nb_heure', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>

                        <div className="mt-4 p-3 bg-leather/5 rounded text-[13px] text-leather-dark">
                            <strong>Gain estimé :</strong>
                            <div className="flex justify-between mt-1">
                                <span>PV: +{recoveryPreview.pv}</span>
                                <span>PM: +{recoveryPreview.pa}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ALCOOL */}
                <div className="bg-parchment/30 p-6 rounded-lg shadow-sm border border-leather/20">
                    <h2 className="text-xl font-bold text-leather mb-4 border-b border-leather/20 pb-2">Alcool</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Alcool Léger (Doses)</label>
                            <SmartInput
                                type="number"
                                min={0}
                                value={status.alcohol.leger || ''}
                                onCommit={(val) => updateStatus('alcohol', 'leger', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Alcool Fort (Doses)</label>
                            <SmartInput
                                type="number"
                                min={0}
                                value={status.alcohol.fort || ''}
                                onCommit={(val) => updateStatus('alcohol', 'fort', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Gueule de bois</label>
                            <SmartInput
                                type="number"
                                min={0}
                                value={status.alcohol.gueule_de_bois || ''}
                                onCommit={(val) => updateStatus('alcohol', 'gueule_de_bois', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. DROGUE */}
                <div className="bg-parchment/30 p-6 rounded-lg shadow-sm border border-leather/20">
                    <h2 className="text-xl font-bold text-leather mb-4 border-b border-leather/20 pb-2">Drogue</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Type de Drogue</label>
                            <select
                                value={status.drug?.type || 'Aucune'}
                                onChange={(e) => updateStatus('drug', 'type', e.target.value)}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            >
                                <option value="Aucune">Aucune</option>
                                <option value="ADD">ADD</option>
                                <option value="ADD+">ADD+</option>
                                <option value="ADD++">ADD++</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[13px] font-bold uppercase text-leather-light mb-1">Jours de retard</label>
                            <SmartInput
                                type="number"
                                min={0}
                                value={status.drug?.jours_retard || 0}
                                onCommit={(val) => updateStatus('drug', 'jours_retard', Number(val))}
                                className="p-2 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none"
                            />
                        </div>

                        {status.drug && status.drug.type !== 'Aucune' && (
                            <div className="mt-4 p-3 bg-leather/5 rounded text-[13px] text-leather-dark">
                                <strong>Effet (Informations) :</strong>
                                <div className="mt-1 italic">
                                    {status.drug.type === 'ADD' && "Tous les 2 jours sinon -1 à toutes les carac (cumulatif - auto)"}
                                    {status.drug.type === 'ADD+' && "Tous les jours ou après un gros combat sinon -1 à toutes les carac (cumulatif - auto)"}
                                    {status.drug.type === 'ADD++' && "Tous les jours ou après un combat sinon -1 à toutes les carac (cumulatif - auto)"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. DESCRIPTION */}
                {/* 5. DESCRIPTION */}
                <div className="bg-parchment/30 p-6 rounded-lg shadow-sm border border-leather/20 md:col-span-2 lg:col-span-2 flex flex-col">
                    <h2 className="text-xl font-bold text-leather mb-4 border-b border-leather/20 pb-2">Description</h2>
                    <div className="flex-1 min-h-[150px] flex flex-col">
                        <SmartInput
                            type="textarea"
                            value={description}
                            onCommit={(val) => onDescriptionChange(String(val))}
                            placeholder="Description physique, signes particuliers..."
                            className="w-full flex-1 p-3 text-[13px] bg-input-bg border border-leather/30 rounded focus:border-leather outline-none resize-none font-serif leading-relaxed"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
