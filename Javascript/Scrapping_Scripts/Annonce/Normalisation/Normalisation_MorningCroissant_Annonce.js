const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../../dateUtils');
const { getOldData } = require('../../dataUtils');


const cities = [
    "Paris", "Montreuil", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

cities.forEach(city => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${city}_${currentDate}.json`);
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier pour ${city}: ${error}`);
        return; // Passe à la ville suivante si le fichier n'existe pas
    }

    const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${city}_${previousDate}.json`);
    const previousData = getOldData(previousDataPath)

    let normalizedDataArray = rawData.map(item => normalizeData(item));

    if (previousData.length === 0) {
        newAnnouncements = [];
        removedAnnouncements = [];
        upToDateAnnouncements = normalizedDataArray;
    } else {
        newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        removedAnnouncements = previousData.filter(oldItem => !normalizedDataArray.some(newItem => newItem.link === oldItem.link));
        upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));
    }

    const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_MorningCroissant/Normalized_Data_MorningCroissant_Annonces_${city}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/Normalized_Data_${city.name}/Updated_Data_MorningCroissant_${city.name}.json`);

    fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

    console.log(`Il y a ${normalizedDataArray.length} annonces sur MorningCroissant pour ${city}.`);
    console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city}: ${newAnnouncements.length} nouvelles annonces.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city}.`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city}.`);
});

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
    const residents = data.details["Capacité"] ? data.details["Capacité"].replace(' personnes', '').trim() : '';

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
        size: data.size.replace(/\s*m²/, '').trim(),
        minStay: rules.minStay,
        maxStay: rules.maxStay,
        description: data.description,
        amenities: amenities,
        meuble: [], // À compléter si nécessaire
        rooms: data.bedDisposal, // À vérifier et ajuster si nécessaire
        rules: rules,
        publicationDate: getCurrentDateString(),
        lastUpdate: getCurrentDateString(),
        link: data.link,
    };
}