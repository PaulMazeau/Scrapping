const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Spécifiez le chemin d'accès au fichier contenant votre JSON brut
const rawDataPath = `../../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${getCurrentDateString()}.json`;

// Lecture du fichier JSON brut
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    return {
        title: data.title,
        location: {
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || ''
        },
        images: data.images,
        address: data.address,
        price: {
            rent: data.price,
            deposit: data.deposit,
            agencyFees: data.agencyFees,

        },
        amenities: data.amenities || [],        
        publicationDate: data.publicationDate,
        lastUpdate: getCurrentDateString(),
        disponibility: getCurrentDateString(),
        virtualTour: data.virtualTour || '',
        size: data.area.replace('m²', '').trim(),
        description: data.description.replace(/<br>\n/g, '').replace(/<[^>]*>/g, ''),
        nearTo: data.schools ? data.schools.map(school => school.name.trim()) : [],
    };
}

// Normalisation de chaque annonce
let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

// Écriture des données normalisées dans un fichier (facultatif)
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_ImmoJeune_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
