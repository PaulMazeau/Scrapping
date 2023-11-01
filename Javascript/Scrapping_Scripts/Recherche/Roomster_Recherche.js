const axios = require('axios');
const fs = require('fs').promises;
const moment = require('moment');
const path = require('path');

const baseURL = "https://www.roomster.com/api/search";
const params = {
    "search_params.page_number": 1,
    "search_params.service_type": "haveshare",
    "search_params.sort": "LastActivity",
    "search_params.budget.min": 0,
    "search_params.budget.max": 5000,
    "search_params.age.min": 18,
    "search_params.age.max": 99,
    "search_params.geo.lat_sw": 48.68600550000002,
    "search_params.geo.lng_sw": 1.8559090000001388,
    "search_params.geo.lat_ne": 49.03160949999999,
    "search_params.geo.lng_ne": 2.838084999999942,
    "search_params.geo.radius_scale": 1,
    "search_params.geo.country_code": null,
    "search_params.include_total_count": true,
    "search_params.is_cache_loaded": true,
    "search_params.searchLocation": "Paris, France",
    "search_params.geoIsNotFound": false,
    "search_params.withoutPush": false,
    "search_params.page_size": 11
};

const getOldData = async filename => {
    try {
        return JSON.parse(await fs.readFile(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
};

const scrapeData = async () => {
    let allData = [];
    
    const response = await axios.get(baseURL, { params: params });

    if (response.status !== 200) {
        console.error(`Erreur ${response.status}: ${response.statusText}`);
        return;
    }

    const totalCount = response.data.count;
    const totalPages = Math.ceil(totalCount / params["search_params.page_size"]);
    allData = allData.concat(response.data.items || []);  // Correction : utilisation de "items" à la place de "listings"

    for (let i = 2; i <= totalPages; i++) {
        params["search_params.page_number"] = i;
        const nextPageResponse = await axios.get(baseURL, { params: params });
        if (nextPageResponse.status === 200) {
            allData = allData.concat(nextPageResponse.data.items || []);  // Correction : utilisation de "items" à la place de "listings"
        }
    }

    const currentDateString = moment().format('YYYY-MM-DD');
    const previousDateString = moment().subtract(1, 'days').format('YYYY-MM-DD');
    
    const oldFileName = path.join(__dirname, '../../Resultat_Recherche/Roomster_Recherche', `Data_Roomster_Recherche_${previousDateString}.json`);
    const oldData = await getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.id === item.id));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.id === item.id));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.id === item.id));

    const outputFileName = path.join(__dirname, '../../Resultat_Recherche/Roomster_Recherche', `Data_Roomster_Recherche_${currentDateString}.json`);
    const updatedFileName = path.join(__dirname, '../../Resultat_Recherche/Up_To_Date_Recherche/Roomster_Recherche_Up_To_Date', `Updated_Data_Roomster_Recherche_${currentDateString}.json`);

    await fs.writeFile(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    await fs.writeFile(updatedFileName, JSON.stringify(updatedData, null, 4), 'utf-8');

    console.log(`Total scraped listings: ${allData.length}`);
    console.log(`Today's data saved to ${outputFileName}`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
    console.log(`${removedAnnouncements.length} removed listing(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} retained listing(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);
};

scrapeData().catch(error => console.error(error));
