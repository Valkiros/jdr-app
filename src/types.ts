export interface RefEquipementRaw {
    id: number;
    ref_id: number;
    category: string;
    nom: string;
    degats?: any;
    caracteristiques?: any;
    protections?: any;
    prix_info?: any;
    craft?: any;
    details?: any; // Contains poids, description, etc.
}

// Flat interface for UI components
export interface RefEquipement {
    id: number;
    ref_id: number;
    category: string;
    nom: string;
    poids: number;
    esquive_bonus: number;
    degats_pr: string;
    description: string;
    raw: RefEquipementRaw; // Access to full structure
}

export interface Equipement {
    id: string; // Unique ID for React key (uuid)
    refId: number; // ID from RefEquipement (Supabase ID)
    originalRefId: number; // Original JSON ID
    nom: string;
    poids: number;
    esquive_bonus: number;
    degats_pr: string;
    equipement_type: 'Armure' | 'Arme' | 'Sac' | 'Autre';
    equipe: boolean;
    details?: any; // Carried over from RefEquipement
}

export interface BaseStats {
    esquive_naturelle: number;
}

export interface FinalStats {
    esquive_totale: number;
    esquive_naturelle: number;
    bonus_equipement: number;
    malus_poids: number;
    malus_etats: number;
}

export interface Etats {
    fatigue: number;
    alcool: number;
    drogue: number;
    blessure_tete: number;
}
