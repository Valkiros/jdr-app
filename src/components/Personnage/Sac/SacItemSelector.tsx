import React from 'react';
import { RefEquipement } from '../../../types';
import { getItemWeight } from '../../../utils/sacUtils';

interface SacItemSelectorProps {
    referenceOptions: RefEquipement[];
    onAddItem: (refItem: RefEquipement) => void;
}

export const SacItemSelector: React.FC<SacItemSelectorProps> = ({ referenceOptions, onAddItem }) => {
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Extract unique categories, simpler logic than useMemo for now as it's just strings
    const categories = React.useMemo(() => {
        const cats = new Set(referenceOptions.map(r => r.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [referenceOptions]);

    const filteredItems = React.useMemo(() => {
        if (!selectedCategory) return [];
        let items = referenceOptions.filter(r => r.category === selectedCategory);

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(r =>
                r.nom.toLowerCase().includes(lowerTerm) ||
                String(r.ref_id).includes(lowerTerm)
            );
        }
        return items.sort((a, b) => a.nom.localeCompare(b.nom));
    }, [referenceOptions, selectedCategory, searchTerm]);

    return (
        <div className="bg-parchment/30 p-4 rounded border border-leather/20 mb-6">
            <h3 className="font-bold text-leather uppercase text-lg mb-4">Ajouter un objet</h3>

            {/* Category Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            if (selectedCategory === cat) setSelectedCategory(null);
                            else {
                                setSelectedCategory(cat);
                                setSearchTerm('');
                            }
                        }}
                        className={`px-3 py-1 rounded border transition-colors text-sm font-bold uppercase
                            ${selectedCategory === cat
                                ? 'bg-leather text-parchment border-leather'
                                : 'bg-parchment text-leather border-leather/30 hover:border-leather'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Item Selection Area */}
            {selectedCategory && (
                <div className="animate-fade-in bg-input-bg p-3 rounded border border-leather/10">
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder={`Rechercher dans ${selectedCategory}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-1 bg-transparent border-b border-leather/30 focus:border-leather outline-none text-sm text-ink font-bold placeholder-leather/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onAddItem(item)}
                                className="text-left p-2 hover:bg-leather/10 rounded border border-transparent hover:border-leather/20 text-sm flex flex-col group transition-all"
                                title={item.effet || ''}
                            >
                                <span className="font-bold text-leather group-hover:text-leather-dark">
                                    {item.nom} <span className="text-xs text-leather/50 font-normal">#{item.ref_id}</span>
                                </span>
                                <span className="text-xs text-ink-light">
                                    {getItemWeight(item)} g
                                </span>
                            </button>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full text-center text-ink-light italic text-sm py-2">
                                Aucun objet trouvé.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
