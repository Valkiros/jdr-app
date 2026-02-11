const fs = require('fs');
const path = require('path');

const files = ['metiers.json', 'origines.json'];
const configDir = path.join('d:', 'Application JDR', 'src-tauri', 'data', 'config');

files.forEach(file => {
    const filePath = path.join(configDir, file);
    try {
        console.log(`Checking ${file}...`);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        // Remove BOM if present
        const jsonContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

        try {
            JSON.parse(jsonContent);
            console.log(`[OK] ${file} is valid JSON.`);
        } catch (e) {
            console.error(`[ERROR] ${file} is INVALID JSON:`, e.message);
        }
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
    }
});
