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

const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas, considérer les données actuelles comme à jour
}

function normalizeData(data) {
    return {
        title: data.title,
        location: {
            address: data.address,
            city: data.propertyDetails && data.propertyDetails["Ville :"] ? data.propertyDetails["Ville :"].replace(':', '').trim() : '',
            postalCode: '', // Ajoutez le code postal si disponible
        },
        images: data.images, // Si vous souhaitez conserver le tableau d'images tel quel
        price: {
            rent: data.propertyDetails && data.propertyDetails["Prix :"] ? data.propertyDetails["Prix :"].replace('€', '').trim() : '',
            rentWithoutCharge: '', // Ajoutez si disponible
            pricem2: data.propertyDetails && data.propertyDetails["Prix au m² :"] ? data.propertyDetails["Prix au m² :"].replace('€', '').trim() : '',
            charge: '', // Ajoutez si disponible
            deposit: data.propertyDetails && data.propertyDetails["Dépôt de garantie :"] ? data.propertyDetails["Dépôt de garantie :"].replace('€', '').trim() : '',
        },
        furnished: data.propertyDetails && data.propertyDetails["Meublé :"] ? data.propertyDetails["Meublé :"].replace(':', '').trim() : 'Non',
        type: data.propertyDetails && data.propertyDetails["Type de propriété:"] ? data.propertyDetails["Type de propriété:"].replace(':', '').trim() : '',
        bedrooms: data.propertyDetails && data.propertyDetails["Pièces :"] ? data.propertyDetails["Pièces :"].replace(':', '').trim() : '',
        bathrooms: data.propertyDetails && data.propertyDetails["Salles de bain :"] ? data.propertyDetails["Salles de bain :"].replace(':', '').trim() : '',
        size: data.propertyDetails && data.propertyDetails["Surface :"] ? data.propertyDetails["Surface :"].replace('m2', '').trim() : '',
        description: data.description,
        verified: data.verified === 'Oui',
        link: data.link,
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

if (previousData.length === 0) {
    const upToDateAnnouncements = normalizedDataArray;

    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Rentola_Normalisation_Up_To_Date/Updated_Data_Rentola_Annonces_${currentDate}.json`);
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Aucune donnée précédente disponible. ${upToDateAnnouncements.length} annonce(s) traitée(s) comme à jour.`);
} else {
    const newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.address === item.location.address));
    const removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === item.title && newItem.location.address === item.location.address));
    const upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Rentola/Normalized_Data_Rentola_Annonces_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Rentola_Normalisation_Up_To_Date/Updated_Data_Rentola_Annonces_${currentDate}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Il y a ${normalizedDataArray.length} annonces sur Rentola.`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Rentola.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
}

