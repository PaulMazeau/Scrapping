const fs = require('fs');
const path = require('path');
const moment = require('moment');

const cities = [
    { name: "Paris", ids: ["-7444"]},
    { name: "Lyon", ids: ["-120965"] },
    { name: "Villeurbanne", ids: ["-120955"] },
    { name: "Vénissieux", ids: ["-164210"] },
    { name: "Saint-Etienne", ids: ["-117905"] },
    { name: "Marseille", ids: ["-76469"] },
    { name: "Toulouse", ids: ["-35738"] },
    { name: "Bordeaux", ids: ["-105270"] },
    { name: "Nantes", ids: ["-59874"] },
    { name: "Rennes", ids: ["-54517"] },
    { name: "Lille", ids: ["-58404"] },
    { name: "Angers", ids: ["-178351"] },
    { name: "Grenoble", ids: ["-80348"] },
    { name: "Montreuil", ids: ["-129423"] },
    { name: "Cergy", ids: ["-120955"] },
];
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
    const images = data.photos ? data.photos.map(photo => photo.url) : [];

    const cityEncoded = encodeURIComponent(data.city || '');
    const propertyTypeEncoded = encodeURIComponent(data.propertyType || '');
    const roomsQuantityEncoded = encodeURIComponent(data.roomsQuantity ? `${data.roomsQuantity}pieces` : '0pieces');
    const idEncoded = encodeURIComponent(data.id || '');

    const url = `https://www.bienici.com/annonce/location/${cityEncoded}/${propertyTypeEncoded}/${roomsQuantityEncoded}/${idEncoded}`;

    return {
        title: data.title || '',
        location: {
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || ''
        },
        images: images,
        price: {
            rent: data.price ? data.price.toString() : '0',
            rentWithoutCharge: data.rentWithoutCharges ? data.rentWithoutCharges.toString() : '0',
            pricem2: data.pricePerSquareMeter ? Math.round(parseFloat(data.pricePerSquareMeter)).toString() : '0',
            charge: data.charges ? data.charges.toString() : '0',
        },
        type: data.propertyType || '',
        bedrooms: data.bedroomsQuantity ? data.bedroomsQuantity.toString() : '0',
        bathrooms: data.showerRoomsQuantity ? data.showerRoomsQuantity.toString() : '0',
        size: data.surfaceArea ? data.surfaceArea.toString() : '0',
        description: data.description || '',
        amenities: data.equipement || [],
        pieces: data.roomsQuantity ? data.roomsQuantity.toString() : '0',
        nearTo: data.district ? [data.district.libelle] : [],
        virtualTour: data.virtualTours && data.virtualTours.length > 0 ? data.virtualTours[0].url : '',
        publicationDate: data.publicationDate || '',
        lastUpdate: data.modificationDate || '',
        verified: data.adCreatedByPro ? 'Oui' : 'Non',
        link: url,
    };
}

cities.forEach(city => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const rawDataPath = path.join(__dirname, `../../../Resultat_Recherche/BienIci_Recherche/Data_BienIci_Recherche_${city.name}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier pour ${city.name}: ${error}`);
        return; // Passe à la ville suivante si le fichier n'existe pas
    }

    let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

    let newAnnouncements, removedAnnouncements, upToDateAnnouncements;

    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_BienIci/Normalized_Data_BienIci_Annonces_${previousDate}.json`);
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = []; // Si le fichier du jour précédent n'existe pas
    }

    if (previousData.length === 0) {
        newAnnouncements = [];
        removedAnnouncements = [];
        upToDateAnnouncements = normalizedDataArray;
    } else {
        newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.address === item.location.address));
        removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === newItem.title && newItem.location.address === item.location.address));
        upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
    }

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_BienIci/Normalized_Data_BienIci_Annonces_${city.name}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/BienIci_Normalisation_Up_To_Date/Updated_Data_BienIci_Annonces_${city.name}_${currentDate}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Il y a ${normalizedDataArray.length} annonces sur BienIci pour ${city.name}.`);
    console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name}: ${newAnnouncements.length} nouvelles annonces.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city.name}.`);
});
