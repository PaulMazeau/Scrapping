const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Recherche/BienIci_Recherche/Data_BienIci_Recherche_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    const images = data.photos ? data.photos.map(photo => photo.url) : [];

    return {
        title: data.title || '',
        location: {
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || ''
        },
        images: images,
        price: {
            rent: data.price ? data.price.toString() : '0',
            rentWithoutCharge: data.rentWithoutCharges ? data.rentWithoutCharges.toString() : '0',
            pricem2: data.pricePerSquareMeter ? data.pricePerSquareMeter.toString() : '0',
            charge: data.charges ? data.charges.toString() : '0',
        },
        type: data.propertyType || '',
        bedrooms: data.bedroomsQuantity ? data.bedroomsQuantity.toString() : '0',
        bathrooms: data.showerRoomsQuantity ? data.showerRoomsQuantity.toString() : '0',
        size: data.surfaceArea ? data.surfaceArea.toString() : '0',
        description: data.description || '',
        amenities: data.equipement || [],
        pieces: data.roomsQuantity ? data.roomsQuantity.toString() : '0',
        nearTo: data.district ? [data.district.libelle] : [],
        virtualTour: data.virtualTours && data.virtualTours.length > 0 ? data.virtualTours[0].url : '',
        publicationDate: data.publicationDate || '',
        lastUpdate: data.modificationDate || '',
        verified: data.adCreatedByPro ? 'Oui' : 'Non',
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_BienIci_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
