const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../../dateUtils');
const { getOldData } = require('../../dataUtils');


function normalizeData(data) {
    let cleanedAddress = data.address.split('\n')[0].trim();
    let cityPart = cleanedAddress.split(',')[1];
    let city = cityPart ? cityPart.split('(')[0].trim() : 'Unknown City';

    let normalizedRooms = data.rooms.map(room => {
        return {
            title: room.title,
            occupancy: room.details.includes("Single occupancy") ? "Single" : "Multiple",
            bedType: room.details.includes("Single bed") ? "Single" : "Double",
            size: room.details.match(/(\d+) m²/)?.[1] || 'Unknown Size',
            bathroom: room.details.includes("Shared bathroom") ? "Shared" : "Private",
            amenities: room.amenities.map(amenity => amenity.trim()),
            price: room.price.replace('From €', '').trim(),
            availability: room.availability.replace('Avail. ', '').trim(),
            photoURL: room.photoURL
        };
    });

    return {
        title: data.name,
        location: {
            address: cleanedAddress.split('(')[0].trim(),
            city: city,
        },
        images: data.images,
        price: {
            rent: data.price ? data.price.replace('€', '').trim() : '0',
            deposit: '',
        },
        furnished: 'Oui', 
        bedrooms: data.bedrooms.replace('bedrooms', '').trim(),
        bathrooms: data.bathrooms.replace('baths', '').trim(),
        residents: data.residents.replace(' residents', '').trim() || '',
        size: data.size.replace('m2', '').trim(),
        minStay: data.minStay || '',
        description: data.description,
        amenities: data.amenities || [],
        virtualTour: data.matterportIframe || '',
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
        verified: data.verified === 'Oui' ? 'Oui' : 'Non',
        rooms: normalizedRooms,
        link: data.link,
    };
}

const cities = [
    { name: "Paris" },
    { name: "Lyon" },
    { name: "Marseille" },
    { name: "Toulouse" },
    { name: "Bordeaux" },
    { name: "Nantes" },
    { name: "Rennes" },
    { name: "Lille" },
    { name: "Angers" },
    { name: "Grenoble" }
];

cities.forEach(city => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${city.name}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier de données brutes pour ${city.name}: ${error}`);
        return; // Passe à la ville suivante si le fichier n'existe pas
    }

    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${city.name}_${previousDate}.json`);
    const previousData = getOldData(previousDataPath);

    // Votre logique de normalisation des données reste la même
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

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Coliving/Normalized_Data_Coliving_Annonces_${city.name}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Normalized_Data_${city.name}/Updated_Data_Coliving_${city.name}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Il y a ${normalizedDataArray.length} annonces sur Coliving pour ${city.name}.`);
    console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name}: ${newAnnouncements.length} nouvelles annonces.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city.name}.`);
});