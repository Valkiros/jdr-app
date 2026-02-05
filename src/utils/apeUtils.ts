/**
 * Maps a specific character origin string to the corresponding key in APE_DATA.
 * Returns the key (e.g., 'barbare', 'humain', 'elfe', etc.)
 */
export const getApeOriginKey = (origin: string): string => {
    if (!origin) return 'humain'; // Default fallback

    const normalized = origin.toLowerCase().trim();

    // Mapping logic
    if (normalized.includes('Barbare') || normalized.includes('Amazone Syldérienne') ||
        normalized.includes('Loup-Garou') || normalized.includes('Minotaure') ||
        normalized.includes('Homme-bête (Canin)') || normalized.includes('Femme-bête (Canin)')) {
        return 'barbare';
    }
    if (normalized.includes('Humain') || normalized.includes('Humaine') ||
        normalized.includes('Demi-Elfe (H)') || normalized.includes('Demie-Elfe (H)') ||
        normalized.includes('Demi-Orque (H)') || normalized.includes('Demie-Orque (H)') ||
        normalized.includes('Vampire') || normalized.includes('Squelette sentient') ||
        normalized.includes('Galéanthrope') || normalized.includes('Wukong') ||
        normalized.includes('Nelfe')) {
        return 'humain';
    }
    if (normalized.includes('Elfe Noir') || normalized.includes('Incube') ||
        normalized.includes('Succube') || normalized.includes('Drac') ||
        normalized.includes('Draque') || normalized.includes('Kitsune') ||
        normalized.includes('Naga')) {
        return 'elfe_noir';
    }
    // Check "elfe" AFTER "elfe noir" to avoid partial match issues
    if (normalized.includes('Elfe Sylvain') || normalized.includes('Haut Elfe') ||
        normalized.includes('Haute Elfe') || normalized.includes('Demi-Elfe (E)') ||
        normalized.includes('Demie-Elfe (E)') || normalized.includes('Homme-Lézard') ||
        normalized.includes('Femme-Lézard') || normalized.includes('Fée')) {
        return 'elfe';
    }
    if (normalized.includes('Orque') || normalized.includes('Demi-Orque (O)') ||
        normalized.includes('Demie-Orque (O)') || normalized.includes('Ogre') ||
        normalized.includes('Ogresse') || normalized.includes('Gobelin') ||
        normalized.includes('Gobeline') || normalized.includes('Murloc') ||
        normalized.includes('Troll') || normalized.includes('Skaven') ||
        normalized.includes('Changelin') || normalized.includes('Changeline') ||
        normalized.includes('Homme-Légume') || normalized.includes('Femme-légume') ||
        normalized.includes('Demi-Démon') || normalized.includes('Demi-Démone') ||
        normalized.includes('Homme-bête (Caprin)') || normalized.includes('Femme-bête (Caprin)') ||
        normalized.includes('Homme-bête (Bovin/Porcin)') || normalized.includes('Femme-bête (Bovin/Porcin)')) {
        return 'peau-verte';
    }
    if (normalized.includes('Nain') || normalized.includes('Naine') ||
        normalized.includes('Nain de la Mafia') || normalized.includes('Naine de la Mafia') ||
        normalized.includes('Nain Duregar') || normalized.includes('Naine Duregar') ||
        normalized.includes('Harpie') || normalized.includes('Profond') ||
        normalized.includes('Profonde')) {
        return 'nain';
    }
    if (normalized.includes('Gnôme') || normalized.includes('Kobold') ||
        normalized.includes('Tengu')) {
        return 'gnome';
    }
    if (normalized.includes('Hobbit')) {
        return 'semi-homme';
    }

    // Default to humain if no match found
    return 'humain';
};
