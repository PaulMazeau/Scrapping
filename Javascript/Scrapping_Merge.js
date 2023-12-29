const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const cities = [
    "Paris", "Montreuil", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest",
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse",
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

cities.forEach(city => {
    // Construisez le chemin du dossier pour la ville courante
    const directoryPath = path.join(__dirname, `./Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Normalized_Data_${city}`);
    let mergedData = [];

    // Assurez-vous que le dossier existe avant de lire
    if (fs.existsSync(directoryPath)) {
        // Lire le dossier
        fs.readdirSync(directoryPath).forEach(file => {
            // Vérifier si le fichier est un JSON
            if (path.extname(file) === '.json') {
                // Construire le chemin complet du fichier
                const filePath = path.join(directoryPath, file);
                // Lire le contenu du fichier
                const data = fs.readFileSync(filePath, 'utf8');
                // Parser le contenu du fichier et ajouter un ID unique à chaque objet
                const annonces = JSON.parse(data).map(annonce => ({
                    id: uuidv4(), // Ajoutez un ID unique ici
                    ...annonce // Étalez les propriétés de l'objet existant
                }));
                // Ajouter les données au tableau global
                mergedData = mergedData.concat(annonces);
            }
        });

        // Convertir le tableau fusionné en JSON
        const mergedJSON = JSON.stringify(mergedData, null, 2);
        const outputDirectory = path.join(__dirname, `./Resultat`);

        // Écrire le résultat dans un nouveau fichier pour chaque ville
        const outputFilePath = path.join(outputDirectory, `Merged_Annonce_${city}.json`);
        fs.writeFileSync(outputFilePath, mergedJSON);

        console.log(`Les fichiers JSON pour ${city} ont été fusionnés et chaque annonce a maintenant un ID unique.`);
    } else {
        console.log(`Le dossier pour la ville ${city} n'existe pas.`);
    }
});
