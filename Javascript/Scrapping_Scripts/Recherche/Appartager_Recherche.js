const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

(async () => {
    const browser = await puppeteer.launch();

    const cities = [
        { name: "Paris", search_id: '3000001266199' },
        { name: "Montreuil", search_id: '3000001266200' },
        { name: "Cergy", search_id: '3000001266202' },
        { name: "Lyon", search_id: '3000001266197' },
        { name: "Villeurbanne", search_id: '3000001266204' },
        { name: "Saint-Priest", search_id: '3000001266206' },
        { name: "Bron", search_id: '3000001266207' },
        { name: "Vénissieux", search_id: '3000001266209' },
        { name: "Saint-Etienne", search_id: '3000001266211' },
        { name: "Marseille", search_id: '3000001266212' },
        { name: "Toulouse", search_id: '3000001266193' },
        { name: "Bordeaux", search_id: '3000001266213' },
        { name: "Nantes", search_id: '3000001266214' },
        { name: "Rennes", search_id: '3000001266216' },
        { name: "Lille", search_id: '3000001266217' },
        { name: "Angers", search_id: '3000001266219' },
        { name: "Grenoble", search_id: '3000001266221' },
    ];

    for (const city of cities) {
        const page = await browser.newPage();
        let offset = 0;
        let allData = [];

        while (true) {
            const url = `https://www.appartager.com/location/?offset=${offset}&search_id=${city.search_id}&sort_by=by_day&mode=list`;
            await page.goto(url, { waitUntil: 'networkidle2' });
        
            const data = await page.evaluate(() => {
                const cards = [...document.querySelectorAll('.result-card')];
                return cards.map(card => {
                    const imageUrl = card.querySelector('.result-card-media__image')?.src || "";
                    const rent = card.querySelector('.result-card-media__rent span:first-child')?.textContent.trim() || "";
                    const rentFrequency = card.querySelector('.result-card-media__rent-frequency')?.textContent.trim() || "";
                    const photoCount = card.querySelector('.result-card-media__count span[aria-label]')?.textContent.trim() || "";
                    const location = card.querySelector('.result-card-info__main-heading span')?.textContent.trim() || "";
                    const membership = card.querySelector('.result-card-info__membership')?.textContent.trim() || "";
                    const highlight = card.querySelector('.result-card-info__summary-item--highlight')?.textContent.trim() || "";
                    const availability = card.querySelector('.result-card-info__summary-item--availability')?.textContent.trim() || "";
                    const roomType = card.querySelector('.result-card-info__summary-item:not(.result-card-info__summary-item--highlight):not(.result-card-info__summary-item--availability):not(.result-card-info__summary-item--membership)')?.textContent.trim() || "";
                    const title = card.querySelector('.result-card-info__heading')?.textContent.trim() || "";
                    const description = card.querySelector('.result-card-info__description')?.textContent.trim() || "";
                    const link = card.querySelector('.result-card__link')?.href || "";
                    return {
                        imageUrl,
                        rent,
                        rentFrequency,
                        photoCount,
                        location,
                        membership,
                        highlight,
                        availability,
                        roomType,
                        title,
                        description,
                        link
                    };
                });
            });

            allData.push(...data);
            console.log(`Scrapped ${data.length} ads from ${url}`);

            // Vérifiez si la page suivante existe après avoir récupéré les données
            const hasNextPage = await page.evaluate(() => {
                const nextPageLink = document.querySelector('#paginationNextPageLink');
                return nextPageLink && nextPageLink.getAttribute('href') !== null;
            });

            if (!hasNextPage) {
                break; // Sortez de la boucle si aucune page suivante n'existe
            }

            offset += 10; // Ou l'incrément approprié pour la pagination
        }

        const currentDate = getCurrentDateString();
        const previousDateString = getPreviousDateString();

        const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Appartager_Recherche/Data_Appartager_Recherche_${city.name}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

        const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
        const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
        const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

        const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Appartager_Recherche/Data_Appartager_Recherche_${city.name}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Appartager_Recherche_Up_To_Date/Updated_Data_Appartager_Recherche_${city.name}_${currentDate}.json`);

        fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

        console.log(`Traitement terminé pour la ville ${city.name}. Nouvelles annonces: ${newAnnouncements.length}. Annonces supprimées: ${removedAnnouncements.length}. Annonces mises à jour: ${updatedData.length - newAnnouncements.length}`);
    }

    await browser.close();
})();
