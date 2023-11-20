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

        const title = document.querySelector('h1.title').innerText;
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
        const filteredImageUrls = images.filter(url => url.startsWith('https://d3hcppa1ebcqsj.cloudfront.net/'));
        const address = title.split(' au ')[1];
        const equipement = [...document.querySelectorAll('.scrolling-wrapper .essentialname')]
            .map(element => element.textContent.trim());
        const description = document.querySelector(".trix-content div")?.textContent.trim() || "";
        const features = {};
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
        const chargesDetails = {
            incluses: [],
            nonIncluses: []
        };
    
        // Sélectionner tous les éléments pour les charges incluses
        const inclusesElements = document.querySelectorAll('.charges_table .filter_green');
        inclusesElements.forEach(element => {
            const chargeItem = element.closest('.d-flex.flex-column.align-items-center.mb-2');
            const chargeName = chargeItem.querySelector('span').textContent.trim();
            chargesDetails.incluses.push(chargeName);
        });
    
        // Sélectionner tous les éléments pour les charges non incluses
        const nonInclusesElements = document.querySelectorAll('.charges_table .filter_grey_from_white');
        nonInclusesElements.forEach(element => {
            const chargeItem = element.closest('.d-flex.flex-column.align-items-center.mb-2');
            const chargeName = chargeItem.querySelector('span').textContent.trim();
            chargesDetails.nonIncluses.push(chargeName);
        });
        console.log('Charge Item OK...');
        console.log('Recherche furniture item...');
    // Récupération des détails des meubles et équipements
    const furnitureDetails = {
        disponibles: [],
        nonDisponibles: []
    };

    // Sélectionner tous les éléments pour les meubles et équipements disponibles
    const disponiblesElements = document.querySelectorAll('.equipment_table .filter_green');
    disponiblesElements.forEach(element => {
        const furnitureItem = element.closest('.d-flex.flex-column.align-items-center.mb-2');
        const furnitureName = furnitureItem.querySelector('span').textContent.trim();
        furnitureDetails.disponibles.push(furnitureName);
    });

    // Sélectionner tous les éléments pour les meubles et équipements non disponibles
    const nonDisponiblesElements = document.querySelectorAll('.equipment_table .filter_grey_from_black');
    nonDisponiblesElements.forEach(element => {
        const furnitureItem = element.closest('.d-flex.flex-column.align-items-center.mb-2');
        const furnitureName = furnitureItem.querySelector('span').textContent.trim();
        furnitureDetails.nonDisponibles.push(furnitureName);
    });
        console.log('Furniture Item OK...');

        // Récupération des détails des mesures
    const measuresDetails = {};

    // Sélectionner toutes les tables de mesures
    const measureTables = document.querySelectorAll('#measures table');
    measureTables.forEach(table => {
        // Récupérer le titre de la catégorie de mesure
        const categoryElement = table.querySelector('.features-title span');
        if (categoryElement) {
            const categoryTitle = categoryElement.textContent.trim();
            measuresDetails[categoryTitle] = {};

            // Parcourir chaque ligne de la table pour obtenir les détails
            const rows = table.querySelectorAll('tbody tr.responsive-data');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    const labelDiv = cell.querySelector('div');
                    const valueDiv = cell.querySelector('.fw-bold.text-right');
                    if (labelDiv && valueDiv) {
                        const label = labelDiv.textContent.trim();
                        const value = valueDiv.textContent.trim();
                        measuresDetails[categoryTitle][label] = value;
                    }
                });
            });
        }
    });

        

        return {
            title,
            address,
            images: filteredImageUrls,
            amenities,
            description,
            features,
            chargesDetails,
            furnitureDetails,
            measuresDetails,
        };
    });

    await page.close(); 
    return data;
}

(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/Flatlooker_Recherche_Up_To_Date/Updated_Data_Flatlooker_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = [];

    const browser = await puppeteer.launch(); 

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(browser, annonce.url);
            allData.push(data); 
            console.log('Annonce faite')
            console.log(allData.length)
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.url} due to: ${error}`);
        }
    }

    await browser.close(); 

    // Créer un nom de fichier basé sur la date actuelle
    const fileName = `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8'); // Écrire toutes les données dans un seul fichier
    console.log(`All data saved to ${fileName}!`);
})();