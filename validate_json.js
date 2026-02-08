const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Application JDR', 'src-tauri', 'data', 'config', 'metiers.json');

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    JSON.parse(rawData);
    console.log('JSON is valid');
} catch (err) {
    console.error('JSON Error:', err.message);
    if (err.message.match(/at position (\d+)/)) {
        const pos = parseInt(err.message.match(/at position (\d+)/)[1]);
        console.log('Error context:', rawData.substring(pos - 50, pos + 50));
    }
}
