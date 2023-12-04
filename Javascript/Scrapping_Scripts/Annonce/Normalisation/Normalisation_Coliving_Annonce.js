const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Chemin d'accès au fichier JSON brut
const rawDataPath = `../../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${getCurrentDateString()}.json`;

// Lecture du fichier JSON brut
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    // Extraction et normalisation des informations de localisation
    const [address, city, postalCode] = ['Unknown Address', 'Unknown City', 'Unknown Postal Code']; // Ajuster selon les données disponibles

    return {
        title: data.name,
        location: {
            address: address,
            city: city,
            postalCode: postalCode
        },
        images: data.imageLinks.map(link => ({ photo1: link })), // Transformer selon la structure requise
        price: {
            rent: data.price ? data.price.replace('€', '').trim() : '0',
            deposit: '',
        },
        furnished: 'Oui', 
        bedrooms: data.bedrooms.replace('bedrooms', '').trim(),
        bathrooms: data.baths.replace('baths', '').trim(),
        residents: data.residents || '',
        size: data.size.replace('m2', '').trim(),
        minStay: data.minStay || '',
        description: data.description,
        amenities: data.amenities || [],
        virtualTour: data.matterportIframe || '',
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
        verified: data.verified === 'Oui' ? 'Oui' : 'Non',
    };
}

// Normalisation de chaque annonce
let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Chemin d'accès pour enregistrer les données normalisées
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Coliving/Normalized_Data_Coliving_Annonces_${getCurrentDateString()}.json`;

// Écriture des données normalisées dans un fichier
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
