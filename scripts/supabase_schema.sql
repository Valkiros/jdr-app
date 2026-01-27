-- Création de la table de référence des équipements
CREATE TABLE IF NOT EXISTS ref_items (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    ref_id INTEGER NOT NULL,   -- L'ID d'origine du fichier JSON
    nom TEXT NOT NULL,
    
    -- Groupes de données (JSONB)
    degats JSONB DEFAULT '{}'::jsonb,           -- degats, pi
    caracteristiques JSONB DEFAULT '{}'::jsonb, -- courage, intelligence, charisme...
    protections JSONB DEFAULT '{}'::jsonb,      -- pr_sol, pr_spe, pr_mag, pluie, froid...
    prix_info JSONB DEFAULT '{}'::jsonb,        -- prix, monnaie (renommé pour éviter conflit avec mot clé)
    craft JSONB DEFAULT '{}'::jsonb,            -- composants, outils, qualif...
    details JSONB DEFAULT '{}'::jsonb,          -- Le reste (poids, description, effets...)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Activation de la sécurité RLS (Row Level Security)
ALTER TABLE ref_items ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire (Lecture publique)
CREATE POLICY "Public Read Access" 
ON ref_items FOR SELECT 
TO anon, authenticated 
USING (true);

-- Politique : Insertion autorisée pour l'initialisation (Anon + Authenticated)
CREATE POLICY "Public Insert Access" 
ON ref_items FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Index pour optimiser la recherche par catégorie (Armes, Potions...)
CREATE INDEX IF NOT EXISTS idx_ref_items_category ON ref_items(category);
