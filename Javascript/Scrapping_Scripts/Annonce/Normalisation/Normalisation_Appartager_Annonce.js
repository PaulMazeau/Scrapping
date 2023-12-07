const fs = require('fs');
const path = require('path');

// Fonctions pour obtenir les dates actuelle et précédente
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

// Chemin vers les données brutes et les données du jour précédent
const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    // Si les données du jour précédent ne sont pas disponibles
    previousData = [];
}
function normalizeData(data) {
    const images = data.images ? data.images.map(img => img) : [];
    const amenities = [];
    const meuble = [];
    const rooms = [];

    return {
        title: data.heading || '',
        location: {
            address: data.address || '',
            city: data.address.split(' ').slice(-1)[0] || '', 
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
        link: data.link,
    };
}

// Normalisation des données actuelles
let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Traitement des annonces en fonction des données du jour précédent
let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
if (previousData.length === 0) {
    console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
    upToDateAnnouncements = normalizedDataArray;
    newAnnouncements = [];
    removedAnnouncements = [];
} else {
    // Comparaison avec les données précédentes pour identifier les changements
    newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
    removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.link === item.link));
    upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
}

// Chemins pour enregistrer les données normalisées et à jour
const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Appartager/Normalized_Data_Appartager_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Appartager_Normalisation_Up_To_Date/Updated_Data_Appartager_Annonces_${currentDate}.json`);

// Enregistrement des données
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

// Affichage des statistiques
console.log(`Il y a ${normalizedDataArray.length} annonces sur Appartager.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
