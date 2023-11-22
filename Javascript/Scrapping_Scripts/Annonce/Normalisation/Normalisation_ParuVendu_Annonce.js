const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    const locationInfo = data.city.split(" ");
    const postalCode = locationInfo.pop().replace(/[()]/g, '');
    const city = locationInfo.join(" ");

    return {
        title: data.title,
        location: { 
            city: city,
            postalCode: postalCode
        },
        images: data.images,
        price: {
            rent: data.price ? data.price.replace('€', '').trim() : '',
        },
        furnished: data.amenities.includes('Meublé') ? 'Oui' : 'Non',
        size: data.amenities.find(amenity => amenity.includes('m2'))?.split(" ")[0] || '',
        description: data.description,
        amenities: data.amenities,
        publicationDate: data.updateDate || getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_ParuVendu_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
