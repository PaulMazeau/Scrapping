const fs = require('fs');

// Lire le fichier JSON
const rawData = fs.readFileSync('...');
const annonces = JSON.parse(rawData);

// Fonction pour vérifier si une annonce est une colocation
function estColocation(description) {
    const regexColocation = /\b(colocation|chambre à louer|colocataire)\b/i;
    const regexNegation = /\b(pas|aucun|sans)\s+de\s+\b(colocation|chambre à louer|colocataire)\b/i;

    return !regexNegation.test(description) && regexColocation.test(description);
}

// Parcourir les descriptions et vérifier si elles sont des colocations
annonces.forEach(annonce => {
    if (estColocation(annonce.description)) {
        console.log("Annonce de colocation détectée:", annonce.description);
    } else {
        console.log("Pas une annonce de colocation:", annonce.description);
    }
});