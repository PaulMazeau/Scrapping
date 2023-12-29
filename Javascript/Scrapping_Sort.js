const fs = require('fs');
const path = require('path');

// Fonction pour vérifier si une annonce est une colocation
function estColocation(description) {
    const regexColocation = /\b(colocation|chambre à louer|colocataire)\b/i;
    const regexNegation = /\b(pas|aucun|sans)\s+de\s+\b(colocation|chambre à louer|colocataire)\b/i;

    return !regexNegation.test(description) && regexColocation.test(description);
}

// Spécifiez le chemin d'accès au dossier contenant les fichiers fusionnés
const directoryPath = path.join(__dirname, './Resultat');
const directoryPathSort = path.join(__dirname, './Resultat_Trier');

// Bouclez sur tous les fichiers du dossier
fs.readdirSync(directoryPath).forEach(file => {
    // Assurez-vous de ne traiter que les fichiers JSON
    if (path.extname(file) === '.json') {
        // Lire le fichier fusionné
        const filePath = path.join(directoryPath, file);
        const rawData = fs.readFileSync(filePath);
        const annonces = JSON.parse(rawData);

        // Séparez les annonces en colocations et non-colocations
        const colocations = [];
        const nonColocations = [];

        annonces.forEach(annonce => {
            if (estColocation(annonce.description)) {
                colocations.push(annonce);
            } else {
                nonColocations.push(annonce);
            }
        });

        // Écrire les colocations dans un nouveau fichier
        const colocationsPath = path.join(directoryPathSort, `./Colocation/colocations_${file}`);
        fs.writeFileSync(colocationsPath, JSON.stringify(colocations, null, 2));

        // Écrire les non-colocations dans un nouveau fichier
        const nonColocationsPath = path.join(directoryPathSort, `./NoColocation/non_colocations_${file}`);
        fs.writeFileSync(nonColocationsPath, JSON.stringify(nonColocations, null, 2));

        console.log(`Fichiers de colocation et non-colocation créés pour ${file}`);
    }
});
