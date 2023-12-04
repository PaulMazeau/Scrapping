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

const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = [];
}

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
        images: data.images.map(link => ({ photo1: link })),
        price: {
            rent: data.price ? data.price.replace('€', '').trim() : '0',
            deposit: '',
        },
        furnished: 'Oui', 
        bedrooms: data.bedrooms.replace('bedrooms', '').trim(),
        bathrooms: data.bathrooms.replace('baths', '').trim(),
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

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

const newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
const removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.link === item.link));
const upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Coliving/Normalized_Data_Coliving_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Coliving_Normalisation_Up_To_Date/Updated_Data_Coliving_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur Coliving.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Coliving.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);