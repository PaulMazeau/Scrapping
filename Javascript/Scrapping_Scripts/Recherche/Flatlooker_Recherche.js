const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.flatlooker.com/appartements?lieu=Paris&min_latitude=48.9166&min_longitude=2.4722&max_latitude=48.7966&max_longitude=2.2322&move_search=true&type=true&zoom=12&commit=Rechercher&show_rented_flats=true', { waitUntil: 'networkidle2' });

    // Obtenez le nombre total de logements
    const totalAdsText = await page.$eval('.fs-3', span => span.textContent.trim());
    const totalAds = parseInt(totalAdsText.split(' ')[0]);

    let properties = [];
    let previousHeight;
    let maxScrolls = 10;  // nombre maximum de défilements
    let scrolls = 0;

    while (properties.length < totalAds && scrolls < maxScrolls) {
        previousHeight = await page.evaluate('document.body.scrollHeight');

        properties = await page.$$eval('.card-header', headers => headers.map(header => {
            const images = Array.from(header.querySelectorAll('.carousel-item img')).map(img => img.getAttribute('data-src') || img.getAttribute('src'));
            const description = header.nextElementSibling.querySelector('.card-flat-description');
            const city = description.querySelector('.card-flat-city').textContent;
            const priceAndArea = description.querySelector('.text-primary').textContent;
            const specs = Array.from(description.querySelectorAll('.card-flat-specs div')).map(div => div.textContent.trim());

            return {
                images,
                city,
                priceAndArea,
                specs
            };
        }));

        let currentHeight = await page.evaluate('document.body.scrollHeight');
        if (currentHeight === previousHeight) break;  // Si on atteint le bas de la page, on sort de la boucle

        if (properties.length < totalAds) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await page.waitForTimeout(3000);  // Augmenter le délai à 3 secondes
            scrolls++;
        }
    }

    console.log(`Scrapped ${properties.length} ads.`);

    const fileName = `../../Resultat_Recherche/Flatlooker_Recherche/Data_Flatlooker_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(properties, null, 2), 'utf-8');

    console.log(`Data saved to ${fileName}!`);
    await browser.close();
})();
