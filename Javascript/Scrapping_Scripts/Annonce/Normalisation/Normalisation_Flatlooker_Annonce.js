const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Spécifiez le chemin d'accès au fichier contenant votre JSON brut
const rawDataPath = `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${getCurrentDateString()}.json`;

// Lecture du fichier JSON brut
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    return {
        title: data.title,
        location: {
            address: data.address,
            city: '', // Il suffit de décortiquer l'adresse
            postalCode: '', // Il suffit de décortiquer l'adresse
        },
        images: data.images, // Si vous souhaitez conserver le tableau d'images tel quel
        price: {
            rent: data.features && data.features["Honoraires de location :"] ? data.features["Honoraires de location :"].replace(':', '').trim() : '',
            rentWithoutCharge: '', // Ajoutez si disponible
            pricem2: data.propertyDetails && data.propertyDetails["Prix au m² :"] ? data.propertyDetails["Prix au m² :"].replace('€', '').trim() : '',
            charge: '', // Ajoutez si disponible
            deposit: data.features && data.features["Honoraires de location :"] ? data.features["Honoraires de location :"].replace(':', '').trim() : '',
        },
        furnished: 'Oui',
        description: data.description,
        verified: data.verified === 'Oui',
    };
}

// Normalisation de chaque annonce
let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Écriture des données normalisées dans un fichier (facultatif)
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Appartager_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
