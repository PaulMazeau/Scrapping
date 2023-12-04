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
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.flatlooker.com/appartements?lieu=Paris&min_latitude=48.9166&min_longitude=2.4722&max_latitude=48.7966&max_longitude=2.2322&move_search=true&type=true&zoom=12&commit=Rechercher&show_rented_flats=true', { waitUntil: 'networkidle2' });

    const totalAdsText = await page.$eval('.fs-3', span => span.textContent.trim());
    const totalAds = parseInt(totalAdsText.split(' ')[0]);

    let properties = [];
    let previousHeight;
    let currentHeight;

    const scrollContainer = await page.$('.flats-wrapper');

    do {
        previousHeight = await page.evaluate(element => element.scrollHeight, scrollContainer);

        await page.evaluate(element => {
            element.scrollTop = element.scrollHeight;
        }, scrollContainer);

        await page.waitForTimeout(2000);

        properties = await page.$$eval('.flat-showcase', showcases => showcases.map(showcase => {
            const images = Array.from(showcase.querySelectorAll('.carousel-inner .carousel-item img')).map(img => img.getAttribute('data-src') || img.getAttribute('src'));
            const descriptionElement = showcase.querySelector('.flat-card-description');
            const description = descriptionElement ? descriptionElement.textContent.trim() : '';
            const cityElement = showcase.querySelector('.flat-card-city');
            const city = cityElement ? cityElement.textContent.trim() : '';
            const priceElement = showcase.querySelector('.flat-card-price');
            const price = priceElement ? priceElement.textContent.trim() : '';
            const urlElement = showcase.querySelector('a');
            const url = urlElement ? 'https://www.flatlooker.com' + urlElement.getAttribute('href') : '';
        
            return {
                images,
                description,
                city,
                price,
                url 
            };
        }));

        currentHeight = await page.evaluate(element => element.scrollHeight, scrollContainer);

    } while (properties.length < totalAds && currentHeight !== previousHeight);

    console.log(`Scrapped ${properties.length} ads.`);

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Flatlooker_Recherche/Data_Flatlooker_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = properties.filter(item => !oldData.some(oldItem => oldItem.url === item.url));
    const removedAnnouncements = oldData.filter(item => !properties.some(newItem => newItem.url === item.url));
    const updatedData = properties.filter(item => !removedAnnouncements.some(removedItem => removedItem.url === item.url));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Flatlooker_Recherche/Data_Flatlooker_Recherche_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Flatlooker_Recherche_Up_To_Date/Updated_Data_Flatlooker_Recherche_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(properties, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Total scraped ads: ${properties.length}`);
    console.log(`Today's data saved to ${outputFileName}`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Flatlooker.`);
    console.log(`${removedAnnouncements.length} removed ad(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} retained ad(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);

    await browser.close();
})();
