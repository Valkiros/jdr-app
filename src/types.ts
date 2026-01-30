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
    type?: string;
}

// Flat interface for UI components
export interface RefEquipement {
    id: number;
    ref_id: number;
    category: string;
    nom: string;
    poids: number;
    pi: number;
    rupture: string;
    esquive_bonus: number;
    degats_pr: string;
    pr_mag: number;
    pr_spe: number;
    item_type: string; // The specific type (Veste, Epée, etc.)
    description: string;
    raw: RefEquipementRaw;
}

export interface Equipement {
    id: string; // Unique ID for React key (uuid)
    refId: number; // ID from RefEquipement (Supabase ID)
    originalRefId: number; // Original JSON ID
    nom: string;
    poids: number;
    esquive_bonus: number;
    degats_pr: string;
    equipement_type: 'Armure' | 'Arme' | 'Sac' | 'Autre' | 'MainsNues';
    equipe: boolean;
    details?: any; // Carried over from RefEquipement
    modif_pi?: string;
    bonus_fo?: number;
    rupture?: string;
    modif_rupture?: string;
    // Protection specific mods
    modif_pr_sol?: string;
    modif_pr_mag?: string;
    modif_pr_spe?: string; // Kept (V5)
    description?: string; // Storing description locally/cache
    char_values?: Record<string, number>; // Bonus/Value for specific characteristics (courage, force, etc.) linked to this item
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


export interface Identity {
    avatar_url: string;
    nom: string;
    sexe: string;
    origine: string;
    metier: string;
    specialisation: string;
    sous_specialisation: string;
}

export interface ValueMax {
    current: number;
    max: number;
    temp: number; // Additionnel/Temporaire
}

export interface Corruption {
    current: number;
    max: number; // 100
    daily: number;
}

export interface Vitals {
    pv: ValueMax;
    pm: ValueMax;
    corruption: Corruption;
}

export interface GeneralStats {
    niveau: number;
    experience: number;
    points_destin: number;
    malus_tete: number;
}

export interface ProtectionValue {
    base: number;
    temp: number;
}

export interface Defenses {
    naturelle: ProtectionValue;
    solide: ProtectionValue;
    speciale: ProtectionValue;
    magique: ProtectionValue;
    bouclier_actif: boolean;
}

export interface Movement {
    marche: ProtectionValue; // re-use ProtectionValue for Base/Temp structure
    course: ProtectionValue;
}

export interface MagicStealth {
    magie_physique: ProtectionValue;
    magie_psychique: ProtectionValue;
    resistance_magique: ProtectionValue;
    discretion: ProtectionValue;
}

export interface CharacteristicColumn {
    naturel: number;
    t1: number;
    t2: number;
    t3: number;
}

export interface Characteristics {
    courage: CharacteristicColumn;
    intelligence: CharacteristicColumn;
    charisme: CharacteristicColumn;
    adresse: CharacteristicColumn;
    force: CharacteristicColumn;
    perception: CharacteristicColumn;
    esquive: CharacteristicColumn;
    attaque: CharacteristicColumn;
    parade: CharacteristicColumn;
    degats: CharacteristicColumn;
}

export interface TempModifiers {
    mod1: string;
    mod2: string;
    mod3: string;
}

export interface CharacterData {
    identity: Identity;
    vitals: Vitals;
    general: GeneralStats;
    defenses: Defenses;
    movement: Movement;
    magic: MagicStealth;
    characteristics: Characteristics;
    temp_modifiers: TempModifiers;
    inventory: any[]; // Placeholder for now, will link to existing inventory structure
}

export interface CharacterSummary {
    id: string;
    name: string;
    updated_at: string;
}

export interface VersionSummary {
    version_id: number;
    saved_at: string;
}

export interface StatComponent {
    label: string;
    value: number;
}

export interface StatDetail {
    formula: string;
    components: StatComponent[];
    total: number;
}

export interface Requirements {
    COUR?: number;
    INT?: number;
    CHA?: number;
    AD?: number;
    FO?: number;
}

export interface Origine {
    id: number;
    name_m: string;
    name_f: string;
    min: Requirements;
    max: Requirements;
    vitesse: number;
}

export interface Metier {
    id: number;
    name_m: string;
    name_f: string;
    min: Requirements;
    max: Requirements;
}

export interface GameRules {
    origines: Origine[];
    metiers: Metier[];
}
