const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getOldData(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://rentola.fr/location?location=paris&rent=0-500&rooms=0-1&property_types=studio');
    await page.waitForSelector('.property');

    let ads = [];
    let lastAdCount = 0;

    const totalAds = await page.evaluate(() => {
        const totalResultsText = document.querySelector('.total-results').textContent;
        const numberWithoutSpaces = totalResultsText.replace(/\s+/g, '');
        return parseInt(numberWithoutSpaces.match(/\d+/)[0], 10);
    });

    console.log(`Total ads to scrape: ${totalAds}`);

    let retries = 0;

    while (ads.length < totalAds && retries < 5) {
        const newAds = await page.evaluate(selector => {
            const adNodes = document.querySelectorAll(selector);
            const results = [];
            adNodes.forEach(adNode => {
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
                    images,
                    location,
                    surface,
                    rooms
                });
            });
            return results;
        }, '.property');

        ads = ads.concat(newAds.slice(lastAdCount));

        if (ads.length < totalAds) {
            await page.evaluate(() => {
                const btn = document.getElementById('load-more');
                if (btn) btn.click();
            });

            await page.waitForTimeout(5000);

            if (lastAdCount === newAds.length) {
                retries++;
            } else {
                retries = 0;
            }

            lastAdCount = newAds.length;
        }
    }

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Rentola_Recherche/Data_Rentola_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAds = ads.filter(ad => !oldData.some(oldAd => oldAd.id === ad.id));
    const removedAds = oldData.filter(oldAd => !ads.some(ad => ad.id === oldAd.id));
    const updatedAds = ads.filter(ad => !removedAds.some(removedAd => removedAd.id === ad.id));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Rentola_Recherche/Data_Rentola_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Rentola_Recherche_Up_To_Date/Updated_Data_Rentola_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(ads, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedAds, null, 2), 'utf-8');

    console.log(`Total scraped ads: ${ads.length}`);
    console.log(`Today's data saved to ${outputFileName}`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAds.length} nouvelles annonces sur Rentola.`);
    console.log(`${removedAds.length} removed ad(s).`);
    console.log(`${updatedAds.length - newAds.length} retained ad(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);

    await browser.close();
})();
