import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using Anon key (ensure RLS allows insert or use Service Role if blocked)
// Note: Normally for Admin operations you should use SERVICE_ROLE_KEY, but for this dev setup we might reliance on the Policy we just created.

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erreur: Clés Supabase manquantes dans .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.join(__dirname, '../src-tauri/data/items');

const filesToUpload = [
    { file: 'Mains_nues.json', category: 'Mains_nues' },
    { file: 'Armes.json', category: 'Armes' },
    { file: 'Protections.json', category: 'Protections' },
    { file: 'Accessoires.json', category: 'Accessoires' },
    { file: 'Sacs.json', category: 'Sacs' },
    { file: 'Boissons.json', category: 'Boissons' },
    { file: 'Bouffes.json', category: 'Bouffes' },
    { file: 'Potions.json', category: 'Potions' },
    { file: 'Outils.json', category: 'Outils' },
    { file: 'Munitions.json', category: 'Munitions' },
    { file: 'Armes_de_jet.json', category: 'Armes_de_jet' },
    { file: 'Ingredients.json', category: 'Ingredients' },
    { file: 'Objets_magiques.json', category: 'Objets_magiques' },
    { file: 'Objets_speciaux.json', category: 'Objets_speciaux' },
    { file: 'Pieges.json', category: 'Pieges' },
    { file: 'Sacoches.json', category: 'Sacoches' },
];

async function uploadData() {
    console.log(`🚀 Démarrage de l'upload vers ${supabaseUrl}...`);

    for (const { file, category } of filesToUpload) {
        const filePath = path.join(DATA_DIR, file);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Fichier introuvable, sauté : ${file}`);
            continue;
        }

        console.log(`\n📄 Traitement de ${file} (${category})...`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const items = JSON.parse(content);

        // Map items to DB Schema with specific groupings
        const dbItems = items.map(item => {
            // Helper to safe parse int/float
            const pInt = (v) => v ? parseInt(v) || 0 : 0;
            // const pFloat = (v) => v ? parseFloat(v) || 0 : 0;

            // 1. Degats
            const degatsData = {
                degats: item.degats || null,
                pi: item.pi || null
            };

            // 2. Caracteristiques
            const caracData = {
                courage: item.courage,
                intelligence: item.intelligence,
                charisme: item.charisme,
                adresse: item.adresse,
                force: item.force,
                perception: item.perception,
                esquive: item.esquive,
                attaque: item.attaque,
                parade: item.parade,
                mag_psy: item.mag_psy,
                mag_phy: item.mag_phy,
                rm: item.rm,
                mvt: item.mvt,
                discretion: item.discretion
            };

            // 3. Protections
            const protectionData = {
                pr_sol: item.pr_sol,
                pr_spe: item.pr_spe,
                pr_mag: item.pr_mag,
                pluie: item.pluie,
                froid: item.froid,
                chaleur: item.chaleur
            };

            // 4. Prix
            const prixData = {
                prix: item.prix,
                monnaie: item.monnaie
            };

            // 5. Craft
            const craftData = {
                composants: item.composants,
                outils: item.outils,
                qualifications: item.qualifications,
                difficulte: item.difficulte,
                temps_de_confection: item.temps_de_confection,
                confection: item.confection,
                xp_confection: item.xp_confection,
                xp_reparation: item.xp_reparation
            };

            // 6. Details ("Le reste")
            // On clone l'item et on retire ce qu'on a déjà rangé ailleurs pour ne pas dupliquer
            const detailsData = { ...item };

            // Liste des champs à exclure de 'details' car déjà ailleurs
            const excludedFields = [
                'id', 'nom', 'category', // Champs principaux
                'degats', 'pi', // Degats
                'courage', 'intelligence', 'charisme', 'adresse', 'force', 'perception', 'esquive', 'attaque', 'parade', 'mag_psy', 'mag_phy', 'rm', 'mvt', 'discretion', // Caracs
                'pr_sol', 'pr_spe', 'pr_mag', 'pluie', 'froid', 'chaleur', // Protections
                'prix', 'monnaie', // Prix
                'composants', 'outils', 'qualifications', 'difficulte', 'temps_de_confection', 'confection', 'xp_confection', 'xp_reparation' // Craft
            ];

            excludedFields.forEach(field => delete detailsData[field]);

            return {
                category: category,
                ref_id: parseInt(item.id) || 0,
                nom: item.nom || "Sans nom",
                degats: degatsData,
                caracteristiques: caracData,
                protections: protectionData,
                prix_info: prixData,
                craft: craftData,
                details: detailsData // Contient poids, description, et tout champ exotique non listé
            };
        });

        console.log(`   ➡️ Envoi de ${dbItems.length} éléments...`);

        const { error } = await supabase
            .from('ref_items')
            .insert(dbItems);

        if (error) {
            console.error(`   ❌ Erreur d'insertion pour ${category}:`, error.message);
        } else {
            console.log(`   ✅ Succès !`);
        }
    }

    console.log("\n🎉 Upload terminé !");
}

uploadData();
