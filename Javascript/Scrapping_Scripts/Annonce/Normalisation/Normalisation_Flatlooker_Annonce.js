const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../../dateUtils');
const { getOldData } = require('../../dataUtils');

function normalizeData(data) {
    // Extraction de la ville et du code postal depuis l'adresse
    const addressParts = data.address.split(',');
    const address = addressParts[0].trim(); // Prend seulement la partie avant la première virgule
    const postalCode = addressParts.length > 1 ? addressParts[1].trim() : '';
    const city = addressParts.length > 2 ? addressParts[2].trim() : '';    

    return {
        title: data.title,
        location: {
            address: address,
            city: city,
            postalCode: postalCode
        },
        images: data.images,
        price: {
            rent: data.price,
            deposit: data.features["Dépôt de garantie"] ? data.features["Dépôt de garantie"].replace('€', '').trim() : '',
            charge: data.charge
        },
        description: data.description,
        amenities: data.amenities || [],
        meuble: data.furnitureDetails.disponibles || [],
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
        link: data.link,
    };
}

const currentDate = getCurrentDateString();
const previousDate = getPreviousDateString();

const cities = [
    "Paris", "Montreuil", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];


cities.forEach(city => {
    const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${city}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture des données pour ${city}: ${error}`);
        return; // Passer à la ville suivante si le fichier n'existe pas
    }

    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${city}_${previousDate}.json`);
    const previousData = getOldData(previousDataPath);

    let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

    if (previousData.length === 0) {
        newAnnouncements = [];
        removedAnnouncements = [];
        upToDateAnnouncements = normalizedDataArray;
    } else {
        newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        removedAnnouncements = previousData.filter(oldItem => !normalizedDataArray.some(newItem => newItem.link === oldItem.link));
        upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
    }

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Flatlooker/Normalized_Data_Flatlooker_Annonces_${city}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Normalized_Data_${city}/Updated_Data_Flatlooker_${city}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Traitement terminé pour la ville ${city}. Nouvelles annonces: ${newAnnouncements.length}, Annonces supprimées: ${removedAnnouncements.length}, Annonces à jour: ${upToDateAnnouncements.length}.`);
});
