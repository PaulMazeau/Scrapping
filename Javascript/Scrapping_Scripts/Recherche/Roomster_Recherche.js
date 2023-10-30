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
    const outputFileName = path.join(__dirname, '../../Resultat_Recherche/Roomster_Recherche', `Data_Roomster_Recherche_${currentDateString}.json`);
    
    await fs.writeFile(outputFileName, JSON.stringify(allData, null, 4), 'utf-8');
    console.log(`Données du jour sauvegardées dans ${outputFileName}!`);
};

scrapeData().catch(error => console.error(error));