const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Application JDR', 'src-tauri', 'data', 'config', 'metiers.json');

try {
    let rawData = fs.readFileSync(filePath, 'utf8');
    // Remove BOM if present
    if (rawData.charCodeAt(0) === 0xFEFF) {
        rawData = rawData.slice(1);
    }

    const data = JSON.parse(rawData);

    data.forEach(metier => {
        if (metier.Specialisations) {
            metier.Specialisations.forEach(spec => {
                // Fix Spec
                if (typeof spec.Necessite_competence === 'string') {
                    if (spec.code === "" || spec.Necessite_competence === "" || spec.Necessite_competence === "Aucune") {
                        spec.Necessite_competence = [];
                    } else {
                        spec.Necessite_competence = spec.Necessite_competence.split(/ & |,|et/).map(s => s.trim()).filter(s => s);
                    }
                } else if (!Array.isArray(spec.Necessite_competence)) {
                    spec.Necessite_competence = [];
                }

                if (spec.SousSpecialisations) {
                    spec.SousSpecialisations.forEach(subSpec => {
                        // Fix SubSpec
                        if (typeof subSpec.Necessite_competence === 'string') {
                            if (subSpec.Necessite_competence === "" || subSpec.Necessite_competence === "Aucune") {
                                subSpec.Necessite_competence = [];
                            } else {
                                subSpec.Necessite_competence = subSpec.Necessite_competence.split(/ & |,|et/).map(s => s.trim()).filter(s => s);
                            }
                        } else if (!Array.isArray(subSpec.Necessite_competence)) {
                            subSpec.Necessite_competence = [];
                        }
                    });
                }
            });
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, '\t'));
    console.log('Successfully normalized metiers.json');

} catch (err) {
    console.error('Error:', err);
}
