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

const cities = [
    { name: "Paris", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Montreuil", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Cergy", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Lyon", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Villeurbanne", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "SaintPriest", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Bron", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Vénissieux", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Saint-Etienne", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Marseille ", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Toulouse", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Bordeaux", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Nantes", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Rennes", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Lille", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Angers", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Grenoble", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
];

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    
    for (const city of cities) {
        const page = await browser.newPage();

        const url = `https://www.flatlooker.com/appartements?lieu=${city.params}&move_search=true&type=true&zoom=12&commit=Rechercher&show_rented_flats=false`;
        await page.goto(url, { waitUntil: 'networkidle2' });

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

        console.log(`Scrapped ${properties.length} ads for ${city.name}.`);

        const currentDate = getCurrentDateString();
        const previousDate = new Date();
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

        const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Flatlooker_Recherche/Data_Flatlooker_${city.name}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

        const newAnnouncements = properties.filter(item => !oldData.some(oldItem => oldItem.url === item.url));
        const removedAnnouncements = oldData.filter(item => !properties.some(newItem => newItem.url === item.url));
        const updatedData = properties.filter(item => !removedAnnouncements.some(removedItem => removedItem.url === item.url));

        const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Flatlooker_Recherche/Data_Flatlooker_${city.name}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Flatlooker_Recherche_Up_To_Date/Updated_Data_Flatlooker_${city.name}_${currentDate}.json`);

        fs.writeFileSync(outputFileName, JSON.stringify(properties, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

        console.log(`Total scraped ads for ${city.name}: ${properties.length}`);
        console.log(`Today's data saved to ${outputFileName}`);
        console.log(`TOTAL_NOUVELLES_ANNONCES for ${city.name}: ${newAnnouncements.length} nouvelles annonces.`);
        console.log(`${removedAnnouncements.length} removed ad(s) for ${city.name}.`);
        console.log(`${updatedData.length - newAnnouncements.length} retained ad(s) for ${city.name}.`);
        console.log(`Updated data saved to ${updatedFileName}`);

        await page.close();
        await new Promise(resolve => setTimeout(resolve, 60000)); // Délai de 1 minute entre chaque ville
    }

    await browser.close();
})();
