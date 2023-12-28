const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const cities = [
    "Paris", "Cergy", "Lyon", "Villeurbanne", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

(async () => {
    const browser = await puppeteer.launch();
    const currentDate = getCurrentDateString();
    const previousDateString = getPreviousDateString();

    for (const city of cities) {
        const page = await browser.newPage();
        const citySlug = city.toLowerCase().replace(' ', '-');

        await page.goto(`https://rentola.fr/location?location=${citySlug}&rent=0-500&rooms=0-1&property_types=studio`, { timeout: 60000 });
        await page.waitForSelector('.property');

        let ads = [];
        let lastAdCount = 0;
        let retries = 0;

        while (ads.length < 100 && retries < 5) {
            const newAds = await page.evaluate(() => {
                const adNodes = document.querySelectorAll('.property');
                const results = [];
                adNodes.forEach(adNode => {
                    const link = adNode.querySelector('a').getAttribute('href');
                    const fullLink = `https://rentola.fr${link}`; // Formation du lien complet
                    const id = adNode.getAttribute('data-controller').split('--')[1];
                    const favoriteBtn = adNode.querySelector('.favorite');
                    const propertyId = favoriteBtn.getAttribute('data-property-id');
                    const togglePath = favoriteBtn.getAttribute('data-toggle-path');
                    const images = Array.from(adNode.querySelectorAll('.property-image')).map(img => img.getAttribute('data-src'));
                    const location = adNode.querySelector('.location-label').innerText;
                    const surface = adNode.querySelector('.prop-value').innerText; 
                    const rooms = adNode.querySelectorAll('.prop-value')[1].innerText;
            
                    results.push({
                        id,
                        propertyId,
                        togglePath,
                        link: fullLink, // Ajout du lien complet ici
                        images,
                        location,
                        surface,
                        rooms
                    });
                });
                return results;
            });

            ads = [...new Set([...ads, ...newAds])];

            if (lastAdCount === ads.length) {
                retries++;
            } else {
                retries = 0;
            }

            lastAdCount = ads.length;

            if (ads.length >= 100 || retries >= 5) {
                break;
            }

            await page.evaluate(() => {
                const btn = document.getElementById('load-more');
                if (btn) btn.click();
            });

            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Rentola_Recherche/Data_Rentola_${citySlug}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

        const newAds = ads.filter(ad => !oldData.some(oldAd => oldAd.id === ad.id));
        const removedAds = oldData.filter(oldAd => !ads.some(ad => ad.id === oldAd.id));
        const updatedAds = ads.filter(ad => !removedAds.some(removedAd => removedAd.id === ad.id));

        const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Rentola_Recherche/Data_Rentola_Recherche_${citySlug}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Rentola_Recherche_Up_To_Date/Updated_Data_Rentola_Recherche_${citySlug}_${currentDate}.json`);

        fs.writeFileSync(outputFileName, JSON.stringify(ads, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedAds, null, 2), 'utf-8');

        console.log(`Total scraped ads for ${city}: ${ads.length}`);
        console.log(`New ads for ${city}: ${newAds.length}`);
        console.log(`Removed ads for ${city}: ${removedAds.length}`);
        console.log(`Updated ads for ${city}: ${updatedAds.length}`);
        console.log(`Data saved to ${outputFileName}`);

        await page.close();
    }

    await browser.close();
})();