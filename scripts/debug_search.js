
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, '../src-tauri/data/config/competences.json');

try {
    const data = readFileSync(filePath, 'utf8');
    const competences = JSON.parse(data);

    console.log(`Loaded ${competences.length} competences.`);

    const searchTerms = ['Clipitaine', 'Invincible', 'Scien', 'Capitaine'];

    searchTerms.forEach(term => {
        console.log(`\nSearching for "${term}"...`);
        const results = competences.filter(c =>
            (c.Competence && c.Competence.toLowerCase().includes(term.toLowerCase())) ||
            (c.Description && c.Description.toLowerCase().includes(term.toLowerCase()))
        );

        if (results.length > 0) {
            console.log(`Found ${results.length} matches:`);
            results.slice(0, 5).forEach(r => {
                console.log(`- ${r.Competence}`);
                console.log(`  Description: ${r.Description}`);
            });
        } else {
            console.log("No matches found.");
        }
    });

    console.log("\nChecking for 'Scien' in normalized form...");
    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const scienResults = competences.filter(c =>
        normalize(c.Competence).includes("scien")
    );
    if (scienResults.length > 0) {
        console.log(`Found ${scienResults.length} matches for 'scien' (normalized):`);
        scienResults.slice(0, 5).forEach(r => console.log(`- ${r.Competence}`));
    } else {
        console.log("No matches found for normalized 'scien'.");
    }


} catch (err) {
    console.error("Error reading file:", err);
}
