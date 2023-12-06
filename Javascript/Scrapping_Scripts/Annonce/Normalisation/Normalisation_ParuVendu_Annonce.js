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

const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas
}

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

let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
if (previousData.length === 0) {
    console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
    upToDateAnnouncements = normalizedDataArray;
    newAnnouncements = [];
    removedAnnouncements = [];
} else {
    newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.city === item.location.city));
    removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === newItem.title && newItem.location.city === item.location.city));
    upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
}

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_ParuVendu/Normalized_Data_ParuVendu_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/ParuVendu_Normalisation_Up_To_Date/Updated_Data_ParuVendu_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur ParuVendu.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur ParuVendu.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
