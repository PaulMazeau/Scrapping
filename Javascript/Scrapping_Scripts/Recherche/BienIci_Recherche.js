const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const BASE_URL = 'https://www.bienici.com/realEstateAds.json';
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
        zoneIdsByTypes: { "zoneIds": ["-7444"] }
    }),
    extensionType: 'extendedIfNoResult',
    access_token: 'XFCgRiIm/5gxwcxQg0TU81XoA5F0IuwnwxhoHtf5VDI=:653a380e4d571100b2ac40e6',
    id: '653a380e4d571100b2ac40e6'
};

let allData = [];
let pageNumber = 1;

const getOldData = filename => {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
};

const fetchData = async () => {
    while (true) {
        console.log(`Fetching page ${pageNumber}...`);

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
};

fetchData().then(() => {
    const currentDate = moment();
    const currentDateString = currentDate.format('YYYY-MM-DD');
    const previousDateString = currentDate.subtract(1, 'days').format('YYYY-MM-DD');
    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.id === item.id));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.id === item.id));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.id === item.id));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_${currentDateString}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/BienIci_Recherche_Up_To_Date/Updated_Data_Bienici_Recherche_${currentDateString}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 4), 'utf-8');

    console.log(`Total d'annonces scrappées: ${allData.length}`);
    console.log(`Données du jour sauvegardées dans ${outputFileName}`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur BienIci.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s).`);
    console.log(`Données mises à jour sauvegardées dans ${updatedFileName}`);
});
