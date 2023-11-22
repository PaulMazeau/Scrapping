const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/Koliving_Annonce/Data_Koliving_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    // Conversion des URLs d'images
    const images = data.data.pictures ? data.data.pictures.map(pic => pic.url ) : [];

    return {
        title: data.data.title || '',
        location: {
            address: data.data.addressObj ? data.data.addressObj.street : '',
            city: data.data.addressObj ? data.data.addressObj.city : '',
            postalCode: data.data.addressObj ? data.data.addressObj.zip : ''
        },
        images: images,
        price: {
            rent: data.data.rentInfos ? data.data.rentInfos.rentPrice : '0',
            charge: data.data.rentInfos ? data.data.rentInfos.utilities : '0',
            deposit: data.data.rentInfos ? data.data.rentInfos.deposit : '0',
            
        },
        furnished: 'Oui', // Ou 'Non' selon les données
        type: data.data.type || '',
        bedrooms: data.data.nbBedrooms ? data.data.nbBedrooms.toString() : '0',
        size: data.data.surface ? data.data.surface.toString() : '0',
        description: data.data.description || '',
        amenities: data.data.amenities || [],
        pieces: data.data.nbRooms ? data.data.nbRooms.toString() : '0',
        virtualTour: data.data.virtualVisitUrl || '',
        verified: data.data.isPublished ? 'Oui' : 'Non',
        link: '' 
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Koliving_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
