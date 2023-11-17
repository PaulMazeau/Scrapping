const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const getOldData = filename => {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
};

const baseUrl = 'https://www.lacartedescolocs.fr/listing_search/list_results';
const params = {
    viewport: JSON.stringify({
        canonical_path: "/fr/ile-de-france/paris",
        city: "Paris",
        county: "Paris",
        administrative: "Île-de-France",
        country_code: "fr",
        sw_lat: 48.815575,
        sw_lon: 2.224122,
        ne_lat: 48.902156,
        ne_lon: 2.469703
    }),
    filters: JSON.stringify({
        offset: 0,
        sortBy: "published_at DESC",
        currency: "EUR"
    })
};

const url = `${baseUrl}?${new URLSearchParams(params).toString()}`;

axios.get(url)
    .then(async (response) => {
        const currentDateString = moment().format('YYYY-MM-DD'); // Utilisez moment pour obtenir la date au format désiré
        const resultsToday = response.data.data.res.results || [];

        const previousDayString = moment().subtract(1, 'days').format('YYYY-MM-DD'); // Obtenez la date du jour précédent avec moment

        const oldFileName = path.join(__dirname, '../../Resultat_Recherche/CarteDesColoc_Recherche', `Data_CarteDesColoc_Recherche_${previousDayString}.json`);        
        const oldData = await getOldData(oldFileName);

        const newAnnouncements = resultsToday.filter(item => !oldData.some(oldItem => oldItem._id === item._id));
        const removedAnnouncements = oldData.filter(item => !resultsToday.some(newItem => newItem._id === item._id));
        const updatedData = resultsToday.filter(item => !removedAnnouncements.some(removedItem => removedItem._id === item._id));

        const outputFileName = path.join(__dirname, '../../Resultat_Recherche/CarteDesColoc_Recherche', `Data_CarteDesColoc_Recherche_${currentDateString}.json`);
        const updatedFileName = path.join(__dirname, '../../Resultat_Recherche/Up_To_Date_Recherche/CarteDesColoc_Recherche_Up_To_Date', `Updated_Data_CarteDesColoc_Recherche_${currentDateString}.json`);

        await fs.writeFile(outputFileName, JSON.stringify({ data: { res: { results: resultsToday } } }, null, 4), 'utf-8');
        await fs.writeFile(updatedFileName, JSON.stringify({ data: { res: { results: updatedData } } }, null, 4), 'utf-8');

        console.log(`Total d'annonces scrapées : ${resultsToday.length}`);
        // console.log(`Données du jour sauvegardées dans ${outputFileName}!`);
        // console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
        // console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
        // console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s).`);
        // console.log(`Données mises à jour sauvegardées dans ${updatedFileName}!`);
    })
