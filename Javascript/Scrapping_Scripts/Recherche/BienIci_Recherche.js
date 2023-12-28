const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const BASE_URL = 'https://www.bienici.com/realEstateAds.json';

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

const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

const fetchDataForCity = async (city) => {
    let allData = [];
    let pageNumber = 1;
    let PARAMS = {
        filters: JSON.stringify({
            size: 24,
            from: 0,
            showAllModels: false,
            filterType: "rent",
            propertyType: ["house", "flat", "loft", "castle", "townhouse"],
            page: 1,
            sortBy: "relevance",
            sortOrder: "desc",
            onTheMarket: [true],
            zoneIdsByTypes: { "zoneIds": city.ids }
        }),
        extensionType: 'extendedIfNoResult',
        access_token: 'XFCgRiIm/5gxwcxQg0TU81XoA5F0IuwnwxhoHtf5VDI=:653a380e4d571100b2ac40e6',
        id: '653a380e4d571100b2ac40e6'
    };

    while (true) {
        console.log(`Fetching page ${pageNumber} for ${city.name}...`);

        try {
            const response = await axios.get(BASE_URL, { params: PARAMS });

            if (response.status === 200) {
                const data = response.data;

                if (!data.realEstateAds || data.realEstateAds.length < 24) {
                    allData.push(...data.realEstateAds);
                    break;
                }

                allData.push(...data.realEstateAds);
                PARAMS.filters = JSON.stringify({ ...JSON.parse(PARAMS.filters), "from": allData.length, "page": Math.floor(allData.length / 24) + 1 });
                pageNumber++;
            } else {
                console.log(`Error ${response.status}: ${response.statusText}`);
                break;
            }
        } catch (error) {
            console.error('An error occurred:', error);
            break;
        }
    }

    const currentDateString = getCurrentDateString();
    const previousDateString = getPreviousDateString();
    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_${city.name}_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.id === item.id));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.id === item.id));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.id === item.id));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_${city.name}_${currentDateString}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/BienIci_Recherche_Up_To_Date/Updated_Data_Bienici_Recherche_${city.name}_${currentDateString}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 4), 'utf-8');

    console.log(`Total d'annonces scrappées pour ${city.name}: ${allData.length}`);
    console.log(`Données du jour pour ${city.name} sauvegardées dans ${outputFileName}`);
    console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name}: ${newAnnouncements.length} nouvelles annonces sur BienIci.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
    console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s) pour ${city.name}.`);
    console.log(`Données mises à jour pour ${city.name} sauvegardées dans ${updatedFileName}`);
};

const fetchAllCities = async () => {
    for (const city of cities) {
        await fetchDataForCity(city);
        await delay(60000); // Délai de 1 minute
    }
};

fetchAllCities();
