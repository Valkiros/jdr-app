
import React from 'react';
import { Domaine } from '../../../types';
import { SearchableSelect } from '../../Shared/SearchableSelect';

interface DomainPanelProps {
    domaines: Domaine[];
    selectedDomaine?: string;
    onDomaineChange: (domaine: string) => void;
}

export const DomainPanel: React.FC<DomainPanelProps> = ({ domaines, selectedDomaine, onDomaineChange }) => {
    const selectedDesc = domaines.find(d => d.domaine === selectedDomaine)?.description || '';

    return (
        <div className="mb-6 p-6 bg-parchment/30 rounded-lg shadow-sm border border-leather/20 relative">
            <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide mb-4">Domaine (Preux Chevalier)</h3>
            <div className="overflow-x-auto border border-leather rounded bg-parchment-light">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-leather text-parchment">
                            <th className="p-3 border-b border-leather w-1/3">Domaine</th>
                            <th className="p-3 border-b border-leather">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-parchment hover:bg-parchment-dark transition-colors border-b border-leather/20 last:border-0">
                            <td className="p-3 align-top text-leather-dark">
                                <SearchableSelect
                                    options={domaines.map(d => ({ id: d.domaine, label: d.domaine }))}
                                    value={selectedDomaine || ''}
                                    onChange={onDomaineChange}
                                    className="w-full"
                                    placeholder="Choisir un domaine..."
                                />
                            </td>
                            <td className="p-3 align-top text-sm text-leather-dark whitespace-pre-wrap">
                                {selectedDesc}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
