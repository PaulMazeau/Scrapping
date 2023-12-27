const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const directoryPath = '...';
const filePattern = /Updated_Data_Appartager_Annonces_(.+)_(.+)\.json$/;

let mergedData = [];
let annonceId = 0;

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Erreur lors de la lecture du dossier:', err);
        return;
    }

    files.forEach(file => {
        if (filePattern.test(file)) {
            let rawData = fs.readFileSync(path.join(directoryPath, file));
            let jsonData = JSON.parse(rawData);

            jsonData.forEach(annonce => {
                // Générer un ID unique pour chaque annonce
                annonce.id = uuidv4();
                mergedData.push(annonce);
            });
        }
    });

    fs.writeFileSync('mergedDataWithIds.json', JSON.stringify(mergedData, null, 2));
    console.log('Fusion terminée avec IDs.');
});
