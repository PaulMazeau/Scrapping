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

const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas
}

function normalizeData(data) {
    const [city, postalCode] = data.address?.split(',').map(item => item.trim()) || ["Inconnu", "Inconnu"];
    const amenities = data.amenities.reduce((acc, amenity) => {
        const key = Object.keys(amenity)[0];
        if (amenity[key] === true) {
            acc.push(key);
        }
        return acc;
    }, []);

    return {
        title: data.title,
        location: {
            address: data.address,
            city: city,
            postalCode: postalCode
        },
        images: data.images.map(img => `https://www.morningcroissant.fr${img}`),
        price: {
            rent: data.price,
            rentWithoutCharge: data.rentDetails["Loyer mensuel hors charges"],
            charge: data.rentDetails["Charges mensuelles ?"],
            deposit: data.rentDetails["Dépôt de garantie ?"],
        },
        furnished: data.details["Meublé / non meublé"],
        type: data.details.Catégorie,
        bedrooms: data.details.Chambres,
        bathrooms: data.details["Salles de bains"],
        residents: data.details.Capacité,
        size: data.size,
        minStay: data.modalities["Durée minimum"],
        maxStay: data.modalities["Durée maximum"],
        description: data.description,
        amenities: amenities,        
        rooms: data.bedDisposal.map(bed => ({ room: bed.room, beds: bed.beds })),
        nearTo: data.neighborhoodDescription,
        rules: data.modalities,
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

const newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.address === item.location.address));
const removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === item.title && newItem.location.address === item.location.address));
const upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_MorningCroissant/Normalized_Data_MorningCroissant_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/MorningCroissant_Normalisation_Up_To_Date/Updated_Data_MorningCroissant_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur MorningCroissant.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur MorningCroissant.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);