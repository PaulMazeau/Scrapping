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
    "Paris", "Montreuil", "Cergy",
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
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = []; // Si le fichier du jour précédent n'existe pas
    }

    let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

    let newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
    let removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.link === item.link));
    let upToDateAnnouncements = normalizedDataArray.filter(item => previousData.some(oldItem => oldItem.link === item.link));

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Flatlooker/Normalized_Data_Flatlooker_Annonces_${city}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Flatlooker_Normalisation_Up_To_Date/Updated_Data_Flatlooker_Annonces_${city}_${currentDate}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Traitement terminé pour la ville ${city}. Nouvelles annonces: ${newAnnouncements.length}, Annonces supprimées: ${removedAnnouncements.length}, Annonces à jour: ${upToDateAnnouncements.length}.`);
});
