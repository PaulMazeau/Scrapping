const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    
    const data = await page.evaluate(() => {

        console.log('Recherche du titre...');
        const title = document.querySelector('h1.title').innerText;
        console.log('titre ok');
        const imageUrls = Array.from(document.querySelectorAll('img')).map(img => img.src);
        const filteredImageUrls = imageUrls.filter(url => url.startsWith('https://d3hcppa1ebcqsj.cloudfront.net/'));
        const address = title.split(' au ')[1];
        console.log('Recherche equipement...');
        const equipement = [...document.querySelectorAll('.scrolling-wrapper .essentialname')]
            .map(element => element.textContent.trim());
        console.log('Equipement OK')
        console.log('Recherche description...');
        const description = document.querySelector(".trix-content div")?.textContent.trim() || "";
        console.log('Description OK');
        const features = {};
        console.log('Recherche featureRow...');
        const featureRows = document.querySelectorAll('.table-responsive tr.responsive-data');
        featureRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const keyDiv = cell.querySelector('div');
                const valueDiv = cell.querySelector('div.fw-bold');
                if (keyDiv && valueDiv) {
                    const key = keyDiv.textContent.trim();
                    const value = valueDiv.textContent.trim();
                    features[key] = value;
                }
            });
        });
        console.log('Feature Row OK...');
        const chargeDetails = {};
        const chargeItems = document.querySelectorAll('.charges_table div.d-flex');
        console.log('Recherche Charge Item...');
        chargeItems.forEach(item => {
            const itemName = item.querySelector('span').textContent.trim();
            const isIncluded = item.querySelector('img').classList.contains('filter_green');
            chargeDetails[itemName] = isIncluded ? 'OK' : 'KO';
        });
        console.log('Charge Item OK...');
        const furnitureDetails = {};
        const furnitureItems = document.querySelectorAll('.equipment_table div.d-flex');
        console.log('Recherche furniture item...');
        furnitureItems.forEach(item => {
            const itemName = item.querySelector('span').textContent.trim();
            const isAvailable = item.querySelector('img').classList.contains('filter_green');
            furnitureDetails[itemName] = isAvailable ? 'OK' : 'KO';
        });
        console.log('Furniture Item OK...');
        const measuresDetails = {};
        const measureTables = document.querySelectorAll('#measures table');
        measureTables.forEach(table => {
            // Obtenir le titre de la catégorie de mesure
            const categoryTitle = table.querySelector('.features-title span').textContent.trim();
            measuresDetails[categoryTitle] = {};

            // Parcourir chaque ligne du tableau pour obtenir les détails
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    const label = cell.querySelector('div').textContent.trim();
                    const value = cell.querySelector('.fw-bold').textContent.trim();
                    measuresDetails[categoryTitle][label] = value;
                });
            });
        });
        

        return {
            title,
            address,
            imageUrls: filteredImageUrls,
            equipement,
            description,
            features,
            chargeDetails,
            furnitureDetails,
            measuresDetails,
        };
    });

    await page.close(); 
    return data;
}

(async () => {
    const browser = await puppeteer.launch();
    const url = 'https://www.flatlooker.com/appartements/location-rue-henri-bergson-92600-asnieres-sur-seine-asnieres-sur-seine-meublee-41'; // Remplacez ceci par l'URL que vous souhaitez scraper

    try {
        const data = await scrapePage(browser, url);
        console.log('Annonce faite');

        // Créer un nom de fichier basé sur la date actuelle
        const fileName = `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonce_${getCurrentDateString()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(data, null, 2), 'utf-8'); // Écrire les données dans un fichier
        console.log(`Data saved to ${fileName}!`);
    } catch (error) {
        console.error(`Failed to scrape the page at ${url} due to: ${error}`);
    }

    await browser.close();
})();