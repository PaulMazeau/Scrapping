const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    // Extraction de la ville et du code postal depuis l'adresse
    const addressParts = data.address.split(',');
    const postalCode = addressParts.length > 1 ? addressParts[1].trim() : '';
    const city = addressParts.length > 2 ? addressParts[2].trim() : '';


    return {
        title: data.title,
        location: {
            address: data.address,
            city: city,
            postalCode: postalCode
        },
        images: data.images,
        price: {
            rent: data.features["Honoraires de location"] ? data.features["Honoraires de location"].replace('€', '').trim() : '',
            deposit: data.features["Dépôt de garantie"] ? data.features["Dépôt de garantie"].replace('€', '').trim() : '',
        },
        furnished: 'Oui', 
        description: data.description,
        amenities: data.amenities || [],
        meuble: data.furnitureDetails.disponibles || [],
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Flatlooker_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
