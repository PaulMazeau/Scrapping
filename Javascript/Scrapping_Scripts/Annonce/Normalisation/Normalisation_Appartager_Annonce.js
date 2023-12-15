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

const currentDate = getCurrentDateString();
const previousDateString = getPreviousDateString();
const cities = [
    "Paris", "Montreuil", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

cities.forEach(city => {
    const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${city}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture des données pour ${city}: ${error}`);
        return;
    }

    let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${city}_${previousDateString}.json`);
    let previousData = [];
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        return [];
    }

    // Comparaison avec les données précédentes pour identifier les changements
    let newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
    let removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.link === item.link));
    let upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Appartager/Normalized_Data_Appartager_Annonces_${city}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Appartager_Normalisation_Up_To_Date/Updated_Data_Appartager_Annonces_${city}_${currentDate}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Traitement terminé pour la ville ${city}. Total annonces: ${normalizedDataArray.length}, Nouvelles annonces: ${newAnnouncements.length}, Annonces supprimées: ${removedAnnouncements.length}, Annonces à jour: ${upToDateAnnouncements.length}`);
});