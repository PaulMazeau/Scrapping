const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    const [city, postalCode] = data.address.split(',').map(item => item.trim());
    const amenities = data.amenities.reduce((acc, amenity) => {
        const key = Object.keys(amenity)[0];
        if (amenity[key] === true) {
            acc.push(key);
        }
        return acc;
    }, []);

    return {
        title: data.title,
        location: {
            address: data.address,
            city: city,
            postalCode: postalCode
        },
        images: data.images.map(img => `https://www.morningcroissant.fr${img}`),
        price: {
            rent: data.price,
            rentWithoutCharge: data.rentDetails["Loyer mensuel hors charges"],
            charge: data.rentDetails["Charges mensuelles ?"],
            deposit: data.rentDetails["Dépôt de garantie ?"],
        },
        furnished: data.details["Meublé / non meublé"],
        type: data.details.Catégorie,
        bedrooms: data.details.Chambres,
        bathrooms: data.details["Salles de bains"],
        residents: data.details.Capacité,
        size: data.size,
        minStay: data.modalities["Durée minimum"],
        maxStay: data.modalities["Durée maximum"],
        description: data.description,
        amenities: amenities,        
        rooms: data.bedDisposal.map(bed => ({ room: bed.room, beds: bed.beds })),
        nearTo: data.neighborhoodDescription,
        rules: data.modalities,
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_MorningCroissant_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
