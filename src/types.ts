// C'est la structure qui vient de Supabase
export interface RefEquipementRaw {
    id: number;
    category: string;
    ref_id: number;
    nom: string;
    degats?: any;   // "any" parce qu'il y a plusieurs formats de variables dans la base de données (voir export interface RefEquipement)
    caracteristiques?: any;
    protections?: any;
    prix_info?: any;
    craft?: any;
    details?: any;
}

// C'est la structure qui est utilisée dans l'application
export interface RefEquipement {
    id: number,
    ref_id: number,
    category: string,
    nom: string,

    // Dégâts
    degats?: string,    // Le ? veut dire que ce n'est pas une option obligatoire de l'objet
    pi?: number,

    // Caractéristiques
    courage?: number,
    intelligence?: number,
    charisme?: number,
    adresse?: number,
    force?: number,
    perception?: number,
    esquive?: number,
    attaque?: number,
    parade?: number,
    mag_psy?: number,
    mag_phy?: number,
    rm?: number,
    mvt?: number,
    discretion?: number,

    // Protections
    pr_sol?: number,
    pr_mag?: number,
    pr_spe?: number,
    pluie?: number,
    froid?: number,
    chaleur?: number,

    // Prix et monnaie
    prix: number,
    monnaie: string,

    // Details
    niveau?: number,
    restriction?: string,
    origine_rarete?: string,
    type?: string,
    contenant?: string,
    portee?: string,
    aura?: string,
    mains?: string,
    matiere?: string,
    couvre?: string,
    effet: string,
    charge?: number,
    capacite?: number,
    places?: number,
    poids: number,
    rupture?: string,
    recolte?: string,
    peremption?: string,

    // Craft
    composants: string,
    outils: string,
    qualifications: string,
    difficulte: number,
    temps_de_confection: string,
    confection: string,
    xp_confection: number,
    xp_reparation: number,

    raw: RefEquipementRaw;
}

export interface Equipement {
    uid: string; // ID unique pour React key (uuid)
    id: string; // ID de Supabase
    refId: number; // ID de référence (Notre référence à nous)
    modif_pi?: number;
    modif_rupture?: number;
    modif_pr_sol?: number;
    modif_pr_mag?: number;
    modif_pr_spe?: number;
    equipement_type: 'Armes' | 'Protections' | 'Accessoires' | 'MainsNues' | 'Sacoches' | 'Potions' | 'Objets_magiques' | 'Munitions' | 'Armes_de_jet' | 'Pieges' | 'Outils';    // Références aux catégories
}

// Interface pour l'identité du personnage (avec image)
export interface Identity {
    avatar_url: string;
    nom: string;
    sexe: string;
    origine: string;
    metier: string;
    specialisation: string;
    sous_specialisation: string;
    description?: string;
}

// Interface pour les PVs et PMs (schéma de base)
export interface ValueMax {
    current: number;
    max: number;
    temp: number; // Additionnel/Temporaire
}

// Interface pour la Corruption
export interface Corruption {
    current: number;
    max: number; // 100
    daily: number;
}

// Interface pour les PVs et PMs (détails)
export interface Vitals {
    pv: ValueMax;
    pm: ValueMax;
    corruption: Corruption;
}

// Interface pour le niveau, l'expérience, les points de destin et les blessures à la tête
export interface GeneralStats {
    niveau: number;
    experience: number;
    points_destin: number;
    malus_tete: number;
}

// Interface pour les protections (schéma de base)
export interface ProtectionValue {
    base: number;
    temp: number;
}

// Interface pour les protections (détails)
export interface Defenses {
    naturelle: ProtectionValue;
    solide: ProtectionValue;
    speciale: ProtectionValue;
    magique: ProtectionValue;
    bouclier_actif: boolean;
}

// Interface pour les mouvements (détails)
export interface Movement {
    marche: ProtectionValue; // re-use ProtectionValue for Base/Temp structure
    course: ProtectionValue;
}

// Interface pour la magie et la discrétion (détails)
export interface MagicStealth {
    magie_physique: ProtectionValue;
    magie_psychique: ProtectionValue;
    resistance_magique: ProtectionValue;
    discretion: ProtectionValue;
    // Protection Status (Environment)
    protection_pluie: ProtectionValue;
    protection_froid: ProtectionValue;
    protection_chaleur: ProtectionValue;
}

// Interface pour les caractéristiques (schéma de base)
export interface CharacteristicColumn {
    naturel: number;
    t1: number;
    t2: number;
    t3: number;
}

// Interface pour les caractéristiques (détails)
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

// Interface pour les modificateurs temporaires
export interface TempModifiers {
    mod1: string;
    mod2: string;
    mod3: string;
}

// Interface pour les données du personnage
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
    competences: CharacterCompetence[];
    competences_specialisation: CharacterCompetence[];
    competences_sous_specialisation: CharacterCompetence[];
    status: CharacterStatus;
}

// Interfaces pour la nouvelle page "État & Besoins"
export interface Senses {
    vue: string;
    ouie: string;
    odorat: string;
    humectation: string;
    sentir_danger: number;
}

export interface Fatigue {
    etat: string;
    recuperation: string;
    nb_heure: number;
}

export interface Alcohol {
    leger: number;
    fort: number;
    gueule_de_bois: number;
}

export interface Drug {
    type: string; // 'Aucune', 'ADD', 'ADD+', 'ADD++'
    jours_retard: number;
}

export interface CharacterStatus {
    senses: Senses;
    fatigue: Fatigue;
    alcohol: Alcohol;
    drug: Drug;
}

// Interface pour le résumé du personnage
export interface CharacterSummary {
    id: string;
    name: string;
    updated_at: string;
}

// Interface pour le résumé de la version
export interface VersionSummary {
    version_id: number;
    saved_at: string;
}

// Interface pour les composants de statistiques
export interface StatComponent {
    label: string;
    value: number;
}

// Interface pour les info-bulles des statistiques
export interface StatDetail {
    formula: string;
    components: StatComponent[];
    total: number;
}

// Interface pour les exigences (Origine et Métier)
export interface Requirements {
    COUR?: number;
    INT?: number;
    CHA?: number;
    AD?: number;
    FO?: number;
}

// Interface pour les origines
export interface Origine {
    id: number;
    name_m: string;
    name_f: string;
    min: Requirements;
    max: Requirements;
    vitesse: number;
}

// Interface pour les métiers
export interface Metier {
    id: number;
    name_m: string;
    name_f: string;
    min: Requirements;
    max: Requirements;
}

// Interface pour les inf-bulles des corruptions d'origine
export interface CorruptionOrigineRef {
    Masculin: string;
    Féminin: string;
    Effets: string;
}

// Interface pour les info-bulles des paliers de corruption
export interface CorruptionPalierRef {
    Paliers: number;
    "Aura chaotique (arme)": number;
    "Aura divine (arme)": number;
    "Aura chaotique (protection)": number;
    "Aura divine (protection)": number;
    "Résistance magique (RM)": number;
    "Force (FO)": number;
    "Intelligence (INT)": number;
    "Charisme (CHA)": number;
    Effets: string;
}

// Interface pour les réglages et configurations du jeu
export interface GameRules {
    origines: Origine[];
    metiers: Metier[];
    corruption_origine: CorruptionOrigineRef[];
    corruption_palier: CorruptionPalierRef[];
}

// Interface pour les compétences
export interface Competence {
    nom: string;
    description: string;
    tableau?: string;
}

// Interface pour les compétences du personnage
export interface CharacterCompetence {
    id: string; // Unique ID (uuid)
    nom: string;
    description: string;
    tableau?: string;
}

// Interface pour les profils utilisateurs (rôle dans Supabase)
export interface UserProfile {
    id: string; // References auth.users.id
    role: string; // 'admin', 'gm', 'player'
}
