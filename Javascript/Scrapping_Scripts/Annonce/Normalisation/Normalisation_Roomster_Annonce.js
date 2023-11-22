const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Recherche/Roomster_Recherche/Data_Roomster_Recherche_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    const images = data.listing.images ? data.listing.images.map(img => img) : [];

    return {
        title: data.listing.headline || '',
        location: {
            address: data.listing.geo_location.full_address || '',
            city: data.listing.geo_location.city || '',
            postalCode: data.listing.geo_location.postal_code || ''
        },
        images: images,
        price: {
            rent: data.listing.rates ? data.listing.rates.monthly_rate.toString() : '0',
        },
        furnished: data.listing.share_details ? (data.listing.share_details.is_furnished ? 'Oui' : 'Non') : 'Non',
        type: data.listing.listing ? data.listing.listing.type : '',
        bedrooms: data.listing.roomsQuantity ? data.listing.roomsQuantity.toString() : '0',
        description: data.listing.description_actual || '',
        amenities: data.listing.apartment_amenities || [],
        publicationDate: data.listing.refreshed || '',
        verified: data.user.verified ? 'Oui' : 'Non',
        link: data.listing.url || ''
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Roomster_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
