const fs = require('fs');
const path = require('path');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getPreviousDateString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const currentDate = getCurrentDateString();
const previousDate = getPreviousDateString();

const rawDataPath = path.join(__dirname, `../../../Resultat_Recherche/BienIci_Recherche/Data_BienIci_Recherche_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_BienIci/Normalized_Data_BienIci_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas
}

function normalizeData(data) {
    const images = data.photos ? data.photos.map(photo => photo.url) : [];

    const cityEncoded = encodeURIComponent(data.city || '');
    const propertyTypeEncoded = encodeURIComponent(data.propertyType || '');
    const roomsQuantityEncoded = encodeURIComponent(data.roomsQuantity ? `${data.roomsQuantity}pieces` : '0pieces');
    const idEncoded = encodeURIComponent(data.id || '');

    const url = `https://www.bienici.com/annonce/location/${cityEncoded}/${propertyTypeEncoded}/${roomsQuantityEncoded}/${idEncoded}`;

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
        link: url,
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Traitement des annonces en fonction des données du jour précédent
let newAnnouncements, removedAnnouncements, upToDateAnnouncements;

if (previousData.length === 0) {
    newAnnouncements = [];
    removedAnnouncements = [];
    upToDateAnnouncements = normalizedDataArray;
} else {
    newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.address === item.location.address));
    removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === newItem.title && newItem.location.address === item.location.address));
    upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
}

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_BienIci/Normalized_Data_BienIci_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/BienIci_Normalisation_Up_To_Date/Updated_Data_BienIci_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur BienIci.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur BienIci.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
