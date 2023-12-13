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

const rawDataPath = path.join(__dirname, `../../../Resultat_Recherche/Roomster_Recherche/Data_Roomster_Recherche_${currentDate}.json`);
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/Roomster_Annonce/Data_Roomster_Annonces_${previousDate}.json`);
let previousData;
try {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
} catch (error) {
    previousData = []; // Si le fichier du jour précédent n'existe pas
}

function normalizeData(data) {
    const fullAddress = data.listing.geo_location.full_address || '';
    const addressParts = fullAddress.split(',');
    const address = addressParts[0].trim();
    const amenityMapping = {
        2: 'Terrasse ou Patio',
        4: 'Planchers de bois',
        128: 'Garage',
        256: 'Ascenseur',
        1024: 'Laverie',
        8192: 'Lave-vaisselle',
        524288: 'Prise télévision câble',
        1048576: 'Placard Privé',
        4194304: 'Wifi'
    };

    // Vérifiez si room_amenities est défini et est un tableau
    const amenities = Array.isArray(data.listing.share_details.room_amenities)
        ? data.listing.share_details.room_amenities.map(amenityNum => amenityMapping[amenityNum]).filter(Boolean)
        : [];

    const images = data.listing.images ? data.listing.images.map(img => img) : [];

    return {
        title: data.listing.headline || '',
        location: {
            address: address,
            city: data.listing.geo_location.city || '',
            postalCode: data.listing.geo_location.postal_code || ''
        },
        images: images,
        price: {
            rent: data.listing.rates ? data.listing.rates.monthly_rate.toString() : '0',
            moveinfee: data.movein_fee,
        },
        type: data.listing.listing ? data.listing.listing.type : '',
        bedrooms: data.listing.roomsQuantity ? data.listing.roomsQuantity.toString() : '0',
        residents: data.listing.people_in_household,
        furnished: data.listing.share_details ? data.listing.share_details.is_furnished : false,      
        amenities: amenities,
        disponibility: data.listing.calendar.date_in,       
        description: data.listing.description_actual || '',
        publicationDate: data.listing.refreshed || '',
        verified: data.user.verified ? 'Oui' : 'Non',
        link: data.listing.url || '',
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Traitement des annonces en fonction des données du jour précédent
let newAnnouncements, removedAnnouncements, upToDateAnnouncements;

if (previousData.length === 0) {
    newAnnouncements = [];
    removedAnnouncements = [];
    upToDateAnnouncements = normalizedDataArray;
} else {
    newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.location.address === item.location.address));
    removedAnnouncements = previousData.filter(item => !normalizedDataArray.some(newItem => newItem.title === newItem.title && newItem.location.address === item.location.address));
    upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
}

const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_Roomster/Normalized_Data_Roomster_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Roomster_Normalisation_Up_To_Date/Updated_Data_Roomster_Annonces_${currentDate}.json`);

fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

console.log(`Il y a ${normalizedDataArray.length} annonces sur Roomster.`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Roomster.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
