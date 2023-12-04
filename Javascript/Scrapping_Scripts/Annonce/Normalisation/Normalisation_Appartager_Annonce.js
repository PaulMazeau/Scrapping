const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    const images = data.images ? data.images.map(img => img) : [];
    const amenities = [];
    const meuble = [];
    const rooms = [];

    return {
        title: data.heading || '',
        location: {
            address: data.address || '',
            city: data.address.split(' ').slice(-1)[0] || '', // Simplification, peut être améliorée
        },
        images: images,
        price: {
            rent: data.price.replace('€', '').trim(),
        },
        furnished: data.features.includes('Meublé') ? 'Oui' : 'Non',
        type: data.features.includes('Appartement') ? 'Appartement' : '',
        description: data.description,
        amenities: amenities,
        meuble: meuble,
        rooms: rooms,
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Appartager/Normalized_Data_Appartager_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
