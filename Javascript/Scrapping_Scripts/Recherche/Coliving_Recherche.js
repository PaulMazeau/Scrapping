const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const delay = (duration) => new Promise(resolve => setTimeout(resolve, duration));

const cities = [
    { name: "Paris", id: 339 },
    { name: "Lyon", id: 638 },
    { name: "Marseille", id: 492 },
    { name: "Toulouse", id: 939 },
    { name: "Bordeaux", id: 698 },
    { name: "Nantes", id: 1221 },
    { name: "Rennes", id: 3449 },
    { name: "Lille", id: 659 },
    { name: "Angers", id: 3003 },
    { name: "Grenoble", id: 1050 }
];

const baseURL = "https://coliving.com/locations/search-listings";
let params = {
    price_min: "",
    price_max: "",
    room_type: "",
    bathroom: "",
    initialize: "0",
    zoom: "11",
    "center[lat]": "48.856614",
    "center[lng]": "2.3522219"
};

const scrapeData = async (city) => {
    let allData = [];
    let page = 1;
    let totalScraped = 0;
    params.location_id = city.id;

    while (true) {
        params.page = page;
        const response = await axios.get(baseURL, { params: params });

        if (response.status !== 200) {
            console.log(`Erreur ${response.status}: ${response.statusText}`);
            break;
        }

        const data = response.data.listings || [];
        if (!data.length) {
            break;
        }

        console.log(`Page ${page} : ${data.length} annonces scrapées pour ${city.name}`);
        allData = allData.concat(data);
        totalScraped += data.length;

        if (data.length < 25) {
            break;
        }

        page++;
    }

    const currentDateString = getCurrentDateString();
    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Coliving_Recherche/Data_Coliving_${city.name}_${currentDateString}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Coliving_Recherche_Up_To_Date/Updated_Data_Coliving_${city.name}_${currentDateString}.json`);

    const previousDateString = getPreviousDateString();
    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Coliving_Recherche/Data_Coliving_${city.name}_${previousDateString}.json`);

    const oldData = getOldData(oldFileName);
    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.id === item.id));
    const removedAnnouncements = oldData.filter(oldItem => !allData.some(item => item.id === oldItem.id));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.id === item.id));

    await fs.writeFile(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    await fs.writeFile(updatedFileName, JSON.stringify(updatedData, null, 4), 'utf-8');

    console.log(`Total d'annonces scrapées pour ${city.name} : ${totalScraped}`);
    console.log(`Données du jour pour ${city.name} sauvegardées dans ${outputFileName}!`);
    console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name}: ${newAnnouncements.length} nouvelles annonces.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
    console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s) pour ${city.name}.`);
    console.log(`Données mises à jour pour ${city.name} sauvegardées dans ${updatedFileName}!`);
};

const scrapeCitiesWithDelay = async () => {
    for (const city of cities) {
        await scrapeData(city).catch(error => console.error(`Erreur lors du scraping de ${city.name}: `, error));
        await delay(60000); // Délai de 1 minute
    }
};

scrapeCitiesWithDelay();
