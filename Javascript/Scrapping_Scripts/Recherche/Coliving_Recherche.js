const axios = require('axios');
const fs = require('fs').promises;
const moment = require('moment');
const path = require('path');

const getOldData = async (filename) => {
    try {
        const fileContent = await fs.readFile(filename, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
};

const baseURL = "https://coliving.com/locations/search-listings";
const params = {
    price_min: "",
    price_max: "",
    room_type: "",
    bathroom: "",
    location_id: "77",
    zoom: "4",
    "center[lat]": "46.227638",
    "center[lng]": "2.213749"
};
let allData = [];
let page = 1;
let totalScraped = 0;

const scrapeData = async () => {
    while (true) {
        params.page = page;
        const response = await axios.get(baseURL, { params: params });

        if (response.status !== 200) {
            console.log(`Erreur ${response.status}: ${response.data}`);
            break;
        }

        const data = response.data.listings || [];

        if (!data.length) {
            break;
        }

        console.log(`Page ${page} : ${data.length} annonces scrapées`);
        allData = allData.concat(data);
        totalScraped += data.length;

        if (data.length < 25) {
            break;
        }

        page++;
    }

    const currentDateString = moment().format('YYYY-MM-DD');
    const outputFileName = path.join(__dirname, '../../Resultat_Recherche/Coliving_Recherche', `Data_Coliving_Recherche_${currentDateString}.json`); // Utilisez path.join pour générer le chemin du fichier

    const previousDateString = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const oldFileName = path.join(__dirname, '../../Resultat_Recherche/Coliving_Recherche', `Data_Coliving_Recherche_${previousDateString}.json`); // Utilisez path.join pour générer le chemin du fichier

    const oldData = await getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.id === item.id));
    const removedAnnouncements = oldData.filter(oldItem => !allData.some(item => item.id === oldItem.id));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.id === item.id));

    await fs.writeFile(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    const updatedFileName = path.join(__dirname, '../../Resultat_Recherche/Up_To_Date_Recherche/Coliving_Recherche_Up_To_Date', `Updated_Data_Coliving_Recherche_${currentDateString}.json`); // Utilisez path.join pour générer le chemin du fichier
    await fs.writeFile(updatedFileName, JSON.stringify(updatedData, null, 4), 'utf-8');


    console.log(`Total d'annonces scrapées : ${totalScraped}`);
    console.log(`Données du jour sauvegardées dans ${outputFileName}!`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s).`);
    console.log(`Données mises à jour sauvegardées dans ${updatedFileName}!`);
};

scrapeData().catch(error => console.error(error));
