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

const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas
}

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
            rent: data.price,
            deposit: data.features["Dépôt de garantie"] ? data.features["Dépôt de garantie"].replace('€', '').trim() : '',
            charge: data.charge
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

let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
if (previousData.length === 0) {
    console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
    upToDateAnnouncements = normalizedDataArray;
    newAnnouncements = [];
    removedAnnouncements = [];
} else {
    newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
    removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.link === item.link));
    upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
}

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Flatlooker/Normalized_Data_Flatlooker_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Flatlooker_Normalisation_Up_To_Date/Updated_Data_Flatlooker_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur Flatlooker.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Flatlooker.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
