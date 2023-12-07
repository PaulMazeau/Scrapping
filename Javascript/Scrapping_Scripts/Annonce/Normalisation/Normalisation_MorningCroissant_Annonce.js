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
    // Diviser l'adresse en adresse, ville et code postal
    const addressComponents = data.address.split(',').map(item => item.trim());
    const city = addressComponents.length > 1 ? addressComponents[addressComponents.length - 2] : "Inconnu";
    const postalCode = addressComponents.length > 1 ? addressComponents[addressComponents.length - 1] : "Inconnu";

    // Compléter les URLs des images
    const images = data.images.map(img => `https://www.morningcroissant.fr${img}`);

    // Mappage des détails du prix
    const price = {
        rent: data.rentDetails["Loyer mensuel charges comprises"],
        rentWithoutCharge: data.rentDetails["Loyer mensuel hors charges"],
        charge: (data.rentDetails["Loyer mensuel charges comprises"] - data.rentDetails["Loyer mensuel hors charges"]).toString(),
        deposit: data.rentDetails["Dépôt de garantie ?"],
    };

    // Extraction d'informations depuis la section `details`
    const furnished = data.details["Meublé / non meublé"];
    const type = data.details["Catégorie"];
    const bedrooms = data.details["Chambres"];
    const bathrooms = data.details["Salles de bains"];
    const residents = data.details["Capacité"];
    const size = data.details["Superficie"];

    // Transformation des commodités (`amenities`)
    const amenities = data.amenities.filter(amenity => Object.values(amenity)[0]).map(amenity => Object.keys(amenity)[0]);

    // Traitement des règles et modalités (`modalities`)
    const rules = {
        minStay: data.modalities["Durée minimum"],
        maxStay: data.modalities["Durée maximum"],
        // Ajouter d'autres règles si nécessaires
    };

    // Retourner l'objet normalisé
    return {
        title: data.title,
        location: {
            address: addressComponents[0],
            city: city,
            postalCode: postalCode,
        },
        images: images,
        price: price,
        furnished: furnished,
        type: type,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        residents: residents,
        size: size,
        minStay: rules.minStay,
        maxStay: rules.maxStay,
        description: data.description,
        amenities: amenities,
        meuble: [], // À compléter si nécessaire
        rooms: data.bedDisposal, // À vérifier et ajuster si nécessaire
        rules: rules,
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
    };
}


let normalizedDataArray = rawData.map(item => normalizeData(item));


let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
if (previousData.length === 0) {
    console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
    upToDateAnnouncements = normalizedDataArray;
    newAnnouncements = [];
    removedAnnouncements = [];
} else {
    newAnnouncements = normalizedDataArray.filter(item => 
        !previousData.some(oldItem => oldItem.link === item.link)
    );
    removedAnnouncements = previousData.filter(item => 
        !normalizedDataArray.some(newItem => newItem.link === item.link)
    );
    upToDateAnnouncements = normalizedDataArray.filter(item => 
        !newAnnouncements.includes(item)
    );
}

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_MorningCroissant/Normalized_Data_MorningCroissant_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/MorningCroissant_Normalisation_Up_To_Date/Updated_Data_MorningCroissant_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur MorningCroissant.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur MorningCroissant.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);