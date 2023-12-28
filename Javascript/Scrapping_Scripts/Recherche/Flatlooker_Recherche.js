const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const cities = [
    { name: "Paris", params: "Paris%2C+75000%2C+France&max_latitude=48.7934&max_longitude=2.2283&min_latitude=48.9134&min_longitude=2.4684" },
    { name: "Montreuil", params: "Montreuil%2C+93100%2C+France&max_latitude=48.8311&max_longitude=2.3918&min_latitude=48.8935&min_longitude=2.4906" },
    { name: "Cergy", params: "Cergy%2C+95800%2C+France&max_latitude=49.0217&max_longitude=1.9895&min_latitude=49.0838&min_longitude=2.0883" },
    { name: "Lyon", params: "Lyon%2C+69002%2C+France&max_latitude=45.7247&max_longitude=4.7826&min_latitude=45.7909&min_longitude=4.8814" },
    { name: "Villeurbanne", params: "Villeurbanne%2C+69100%2C+France&max_latitude=45.7402&max_longitude=4.8375&min_latitude=45.8064&min_longitude=4.9364" },
    { name: "SaintPriest", params: "Saint-Priest%2C+69800%2C+France&max_latitude=45.6634&max_longitude=4.8948&min_latitude=45.7297&min_longitude=4.9936" },
    { name: "Bron", params: "Bron%2C+69500%2C+France&max_latitude=45.7006&max_longitude=4.8598&min_latitude=45.7668&min_longitude=4.9587" },
    { name: "Vénissieux", params: "Vénissieux%2C+69200%2C+France&max_latitude=45.6646&max_longitude=4.8361&min_latitude=45.7309&min_longitude=4.935" },
    { name: "Saint-Etienne", params: "Saint-Étienne%2C+42000%2C+France&max_latitude=45.4069&max_longitude=4.3379&min_latitude=45.4734&min_longitude=4.4368" },
    { name: "Marseille ", params: "Marseille%2C+13002%2C+France&max_latitude=43.2616&max_longitude=5.3205&min_latitude=43.3307" },
    { name: "Toulouse", params: "Toulouse%2C+31000%2C+France&max_latitude=43.5701&max_longitude=1.3948&min_latitude=43.6388&min_longitude=1.4937" },
    { name: "Bordeaux", params: "Bordeaux%2C+33000%2C+France&max_latitude=44.8076&max_longitude=-0.6295&min_latitude=44.8748&min_longitude=-0.5306" },
    { name: "Nantes", params: "Nantes%2C+44000%2C+France&max_latitude=47.186&max_longitude=-1.6007&min_latitude=47.2504&min_longitude=-1.5018" },
    { name: "Rennes", params: "Rennes%2C+35000%2C+France&max_latitude=48.0797&max_longitude=-1.7295&min_latitude=48.143&min_longitude=-1.6306" },
    { name: "Lille", params: "Lille%2C+59800%2C+France&max_latitude=50.6065&max_longitude=3.0141&min_latitude=50.6667" },
    { name: "Angers", params: "Angers%2C+49100%2C+France&max_latitude=47.4381&max_longitude=-0.6036&min_latitude=47.5022&min_longitude=-0.5048" },
    { name: "Grenoble", params: "Grenoble%2C+38000%2C+France&max_latitude=45.1541&max_longitude=5.6864&min_latitude=45.221&min_longitude=5.7852" },
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

            await new Promise(resolve => setTimeout(resolve, 5000));

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
        const previousDateString = getPreviousDateString();

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
