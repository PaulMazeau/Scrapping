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

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

function getOldData(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
}

function normalizeData(data) {
    
    return {
        title: data.title,
        location: {
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || ''
        },
        images: data.images,
        price: {
            rent: data.price ? data.price.split('€')[0].trim() : '0',
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
        nearTo: data.nearTo ? data.nearTo.map(nearTo => nearTo.name.trim()) : [],
        link: data.link,
    };
}

const cities = [
    { name: "Paris",},
    { name: "Lyon",},
    { name: "Montreuil",},
    { name: "Cergy",},
    { name: "Villeubarnne"},
    { name: "Bron",},
    { name: "Venissieux",},
    { name: "Saint-Etienne",},
    { name: "Marseille",},
    { name: "Toulouse",},
    { name: "Bordeaux",},
    { name: "Nantes",},
    { name: "Rennes",},
    { name: "Angers",},
    { name: "Grenoble",},
];

(async () => {
    const currentDate = getCurrentDateString();
    const previousDateString = getPreviousDateString();

    for (const city of cities) {
        const rawDataPath = path.join(__dirname, `../../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${city.name}_${currentDate}.json`);
        let rawData;
        try {
            rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
        } catch (error) {
            console.error(`Erreur lors de la lecture du fichier pour ${city.name}: ${error}`);
            continue; // Passe à la ville suivante si le fichier n'existe pas
        }

        const previousDataPath = path.join(__dirname, `../../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${city.name}_${previousDateString}.json`);
        let previousData = getOldData(previousDataPath);

        let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));

        let newAnnouncements = normalizedDataArray.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        let removedAnnouncements = previousData.filter(oldItem => !normalizedDataArray.some(newItem => newItem.link === oldItem.link));
        let upToDateAnnouncements = normalizedDataArray.filter(item => !newAnnouncements.includes(item));

        const normalizedDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Normalized_Data_ImmoJeune/Normalized_Data_ImmoJeune_Annonces_${city.name}_${currentDate}.json`);
        const upToDateDataPath = path.join(__dirname, `../../../Resultat_Annonce/Normalisation/Up_To_Date_Normalized/ImmoJeune_Normalisation_Up_To_Date/Updated_Data_ImmoJeune_Annonces_${city.name}_${currentDate}.json`);

        fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
        fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf8');

        console.log(`Il y a ${normalizedDataArray.length} annonces sur ImmoJeune pour ${city.name}.`);
        console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name}: ${newAnnouncements.length} nouvelles annonces.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
        console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city.name}.`);

        await delay(60000); // Délai de 1 minute
    }
})();