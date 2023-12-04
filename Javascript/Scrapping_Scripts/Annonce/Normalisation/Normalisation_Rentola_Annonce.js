const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Spécifiez le chemin d'accès au fichier contenant votre JSON brut
const rawDataPath = `../../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${getCurrentDateString()}.json`;

// Lecture du fichier JSON brut
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    return {
        title: data.title,
        location: {
            address: data.address,
            city: data.propertyDetails && data.propertyDetails["Ville :"] ? data.propertyDetails["Ville :"].replace(':', '').trim() : '',
            postalCode: '', // Ajoutez le code postal si disponible
        },
        images: data.images, // Si vous souhaitez conserver le tableau d'images tel quel
        price: {
            rent: data.propertyDetails && data.propertyDetails["Prix :"] ? data.propertyDetails["Prix :"].replace('€', '').trim() : '',
            rentWithoutCharge: '', // Ajoutez si disponible
            pricem2: data.propertyDetails && data.propertyDetails["Prix au m² :"] ? data.propertyDetails["Prix au m² :"].replace('€', '').trim() : '',
            charge: '', // Ajoutez si disponible
            deposit: data.propertyDetails && data.propertyDetails["Dépôt de garantie :"] ? data.propertyDetails["Dépôt de garantie :"].replace('€', '').trim() : '',
        },
        furnished: data.propertyDetails && data.propertyDetails["Meublé :"] ? data.propertyDetails["Meublé :"].replace(':', '').trim() : 'Non',
        type: data.propertyDetails && data.propertyDetails["Type de propriété:"] ? data.propertyDetails["Type de propriété:"].replace(':', '').trim() : '',
        bedrooms: data.propertyDetails && data.propertyDetails["Pièces :"] ? data.propertyDetails["Pièces :"].replace(':', '').trim() : '',
        bathrooms: data.propertyDetails && data.propertyDetails["Salles de bain :"] ? data.propertyDetails["Salles de bain :"].replace(':', '').trim() : '',
        size: data.propertyDetails && data.propertyDetails["Surface :"] ? data.propertyDetails["Surface :"].replace('m2', '').trim() : '',
        description: data.description,
        verified: data.verified === 'Oui',
    };
}

// Normalisation de chaque annonce
let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Écriture des données normalisées dans un fichier (facultatif)
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Rentola/Normalized_Data_Rentola_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
