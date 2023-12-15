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
        link: data.link,
    };
}

const currentDate = getCurrentDateString();
const previousDate = getPreviousDateString();

const cities = ["Paris", "Montreuil", "Cergy"];

cities.forEach(city => {
    const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${city}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture des données brutes pour ${city}:`, error);
        return;
    }

    let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

    let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${city}_${previousDate}.json`);
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = [];
    }

    if (previousData.length === 0) {
        newAnnouncements = [];
        removedAnnouncements = [];
        upToDateAnnouncements = normalizedDataArray;
    } else {
        newAnnouncements = normalizedDataArray.filter(item => 
            !previousData.some(oldItem => 
                oldItem.title === item.title && 
                oldItem.location?.city === item.location?.city
            )
        );
        removedAnnouncements = previousData.filter(item => 
            !normalizedDataArray.some(newItem => 
                newItem.title === item.title && 
                newItem.location?.city === item.location?.city
            )
        );
        upToDateAnnouncements = normalizedDataArray.filter(item => 
            !newAnnouncements.includes(item)
        );
    }

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_ParuVendu/Normalized_Data_ParuVendu_Annonces_${city}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/ParuVendu_Normalisation_Up_To_Date/Updated_Data_ParuVendu_Annonces_${city}_${currentDate}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Traitement terminé pour ${city}.`);
    console.log(`Il y a ${normalizedDataArray.length} annonces normalisées pour ${city}.`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur ParuVendu pour ${city}.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city}.`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city}.`);
});
