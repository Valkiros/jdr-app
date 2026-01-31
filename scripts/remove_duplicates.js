
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, '../src-tauri/data/config/competences.json');

try {
    const data = readFileSync(filePath, 'utf8');
    const competences = JSON.parse(data);

    console.log(`Original count: ${competences.length}`);

    const uniqueCompetences = [];
    const seenNames = new Set();

    competences.forEach(comp => {
        if (!seenNames.has(comp.Competence)) {
            seenNames.add(comp.Competence);
            uniqueCompetences.push(comp);
        } else {
            console.log(`Duplicate found: ${comp.Competence}`);
        }
    });

    console.log(`Unique count: ${uniqueCompetences.length}`);

    writeFileSync(filePath, JSON.stringify(uniqueCompetences, null, 2), 'utf8');
    console.log("Duplicates removed and file saved.");

} catch (err) {
    console.error("Error processing file:", err);
}
