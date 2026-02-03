import React from 'react';
import { Equipement, RefEquipement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from './SearchableSelect';

// --- Interface des Propriétés (Props) ---
// Ce sont les données que le composant reçoit de son parent (Inventory.tsx).
interface ProtectionsTableProps {
    items: Equipement[];               // La liste des protections que le joueur possède.
    onItemsChange: (items: Equipement[]) => void; // La fonction pour sauvegarder les changements.
    referenceOptions: RefEquipement[]; // La "Bible" de tous les objets possibles (pour les listes déroulantes).
    defaultItem?: Partial<Equipement>; // Valeurs par défaut lors de l'ajout d'une ligne.
    bouclierActif: boolean;            // Est-ce que le bouclier est utilisable ? (Vient de la gestion des mains).
    onRemove?: (uid: string) => void;
}

export const ProtectionsTable: React.FC<ProtectionsTableProps> = ({ items, onItemsChange, referenceOptions, defaultItem, bouclierActif, onRemove }) => {

    // --- Gestion des Lignes (Ajout / Suppression) ---

    // Ajoute une nouvelle ligne vide dans le tableau. (C'est le bouton "+" qui appelle cette fonction)
    // On crée un objet "Equipement" avec des valeurs par défaut (vide ou 0).
    const handleAddRow = () => {
        const newItem: Equipement = {
            uid: uuidv4(),
            id: '',
            refId: 0,
            equipement_type: 'Protections',
            modif_pi: 0,
            modif_rupture: 0,
            modif_pr_sol: 0,
            modif_pr_mag: 0,
            modif_pr_spe: 0,
            ...defaultItem
        };
        onItemsChange([...items, newItem]);
    };

    // Supprime une ligne précise quand on clique sur la petite croix rouge.
    // On garde tout SAUF l'élément qui a cet ID.
    const handleRemoveRow = (uid: string) => {
        if (onRemove) {
            onRemove(uid);
        } else {
            onItemsChange(items.filter(item => item.uid !== uid));
        }
    };

    // Supprime la toute dernière ligne du tableau (bouton "-").
    const handleRemoveLastRow = () => {
        if (items.length > 0) {
            // On enlève le dernier élément du tableau.
            onItemsChange(items.slice(0, -1));
        }
    };

    // --- Gestion du Changement d'Objet ---
    // Cette fonction est appelée quand l'utilisateur choisit un objet dans la liste déroulante.
    // Elle met à jour la ligne avec les statistiques de l'objet de référence choisi.
    const handleSelectChange = (uid: string, refIdStr: string) => {
        const refId = parseInt(refIdStr);
        // 1. On trouve l'objet dans la base de référence
        const refItem = referenceOptions.find(r => r.id === refId);

        if (refItem) {
            // 2. On met à jour la liste des items
            onItemsChange(items.map(item => {
                if (item.uid === uid) {
                    // 3. On remplace les données de la ligne par celles de la référence
                    return {
                        ...item,
                        refId: refItem.id,
                        equipement_type: 'Protections',
                    };
                }
                return item;
            }));
        } else {
            // Si l'utilisateur efface la sélection, on remet à zéro (ou valeurs par défaut)
            onItemsChange(items.map(item => {
                if (item.uid === uid) {
                    return {
                        ...item,
                        refId: 0,
                        modif_pr_sol: 0,
                        modif_pr_spe: 0,
                        modif_pr_mag: 0,
                        modif_rupture: 0,
                        equipement_type: 'Protections' // Retour au type par défaut
                    };
                }
                return item;
            }));
        }
    };

    const handleUpdateField = (uid: string, field: keyof Equipement, value: any) => {
        onItemsChange(items.map(item => {
            if (item.uid === uid) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // --- Fonctions Utilitaires ---

    // Récupère une valeur dans la base de référence pour un ID donné.
    // C'est grâce à ça que l'affichage reste à jour même si la base change.
    const getRefValue = (refId: number, field: keyof RefEquipement): any => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r[field] : '';
    };

    // Calcule le total (Base + Modificateur) pour l'affichage (PR, etc.)
    const calculateTotalPr = (base: number, modif: number): string | number => {
        const baseVal = parseInt(String(base || 0), 10);
        const modifVal = parseInt(String(modif || 0), 10);
        const total = baseVal + modifVal;
        return total !== 0 ? total : '-'; // Affiche '-' si le total est 0 pour alléger la vue
    };

    return (
        <div className="mb-6 p-4 bg-parchment/50 rounded-lg border-2 border-leather shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4 border-b border-leather/30 pb-2">
                <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide">Protections</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleRemoveLastRow}
                        className="px-3 py-1 bg-parchment border border-leather text-leather font-serif font-bold rounded hover:bg-leather hover:text-parchment active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={items.length === 0}
                        title="Supprimer la dernière ligne"
                    >
                        -
                    </button>
                    <button
                        onClick={handleAddRow}
                        className="px-3 py-1 bg-leather text-parchment font-serif font-bold rounded hover:bg-leather-dark active:scale-95 transition-all shadow-sm"
                        title="Ajouter une ligne"
                    >
                        +
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    {/* --- En-têtes du Tableau --- */}
                    <thead>
                        <tr className="text-sm font-serif font-bold text-leather uppercase tracking-wider border-b-2 border-leather">
                            <th className="p-2 w-12">ID</th>
                            <th className="p-2 w-24">Type</th>
                            <th className="p-2 w-48">Nom</th>

                            {/* Colonnes doubles : Valeur Calculée (Centrée) + Champ de modif (Input) */}
                            <th className="p-2 w-16 text-center">Pr Sol</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-16 text-center">Pr Spé</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-16 text-center">Pr Mag</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-20 text-center">Rupture</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2">Effet</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-ink">
                        {items.map((item) => {
                            // --- Préparation des données pour l'affichage ---
                            // On va chercher les valeurs de base directement dans la référence
                            const refPrSol = getRefValue(item.refId, 'pr_sol');
                            const refPrSpe = getRefValue(item.refId, 'pr_spe');
                            const refPrMag = getRefValue(item.refId, 'pr_mag');
                            const refRupture = getRefValue(item.refId, 'rupture');

                            // Gestion visuelle du bouclier inactif
                            const isShield = getRefValue(item.refId, 'type') === 'Bouclier';
                            const isInactive = isShield && !bouclierActif;

                            return (
                                <tr key={item.uid} className={`border-b border-leather-light/30 hover:bg-leather/5 transition-opacity duration-300 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                                    {/* ID : Affiche l'ID ref */}
                                    <td className="p-2 text-xs text-ink-light">{getRefValue(item.refId, 'ref_id') || '-'}</td>

                                    {/* Type : Affiche le type réel (ex: Bouclier) et un tag (Inactif) si nécessaire */}
                                    <td className="p-2 text-sm italic">
                                        {getRefValue(item.refId, 'type')}
                                        {isShield && !bouclierActif && <span className="ml-1 text-[10px] text-red-500 font-bold">(Inactif)</span>}
                                    </td>

                                    {/* Sélecteur d'objet */}
                                    <td className="p-2 w-48 max-w-[12rem]" title={(() => {
                                        const r = referenceOptions.find(o => o.id === item.refId);
                                        return r?.raw.details?.effet || '';
                                    })()}>
                                        <SearchableSelect
                                            options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                                            value={item.refId}
                                            onChange={(val) => handleSelectChange(item.uid, val)}
                                            className="w-full"
                                        />
                                    </td>

                                    {/* --- PR Solide --- */}
                                    {/* Valeur Totale (Gras) */}
                                    <td className="p-2 text-center font-bold">{calculateTotalPr(refPrSol, item.modif_pr_sol || 0)}</td>
                                    {/* Input de Modification */}
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_sol || ''}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_pr_sol', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* --- PR Spéciale --- */}
                                    <td className="p-2 text-center font-bold">{calculateTotalPr(refPrSpe, item.modif_pr_spe || 0)}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_spe || ''}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_pr_spe', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* --- PR Magique --- */}
                                    <td className="p-2 text-center font-bold">{calculateTotalPr(refPrMag, item.modif_pr_mag || 0)}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_mag || ''}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_pr_mag', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* --- Rupture --- */}
                                    <td className="p-2 text-center">{refRupture || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_rupture || ''}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_rupture', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* Description / Effet */}
                                    <td className="p-2 text-sm max-w-[150px] truncate" title={(() => {
                                        const r = referenceOptions.find(o => o.id === item.refId);
                                        return r?.raw.details?.effet || '';
                                    })()}>
                                        {(() => {
                                            const r = referenceOptions.find(o => o.id === item.refId);
                                            return r?.raw.details?.effet || '';
                                        })()}
                                    </td>

                                    {/* Bouton Supprimer */}
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => handleRemoveRow(item.uid)}
                                            className="text-red-600 hover:text-red-800 font-bold"
                                        >
                                            &times;
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
