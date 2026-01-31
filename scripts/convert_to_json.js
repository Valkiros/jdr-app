
import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Usage: node convert_to_json.js <input_file> [output_file]

const inputArg = process.argv[2];
const outputArg = process.argv[3];

if (!inputArg) {
    console.error("❌ Usage: node convert_to_json.js <input_file> [output_file]");
    process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);

if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
}

try {
    console.log(`📄 Reading ${inputPath}...`);
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet);

    // Determine output path
    let outputPath;
    if (outputArg) {
        outputPath = path.resolve(process.cwd(), outputArg);
    } else {
        const parsed = path.parse(inputPath);
        outputPath = path.join(parsed.dir, `${parsed.name}.json`);
    }

    console.log(`💾 Writing JSON to ${outputPath}...`);
    // Ensure output directory exists if outputArg is provided
    if (outputArg) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log("✅ Conversion complete!");
} catch (error) {
    console.error("❌ Error converting file:", error.message);
    process.exit(1);
}
