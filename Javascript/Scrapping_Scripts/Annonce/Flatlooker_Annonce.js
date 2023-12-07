const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getPreviousDateString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
async function scrapePage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {

        const title = document.querySelector('h1.title').innerText;
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
        const filteredImageUrls = images.filter(url => url.startsWith('https://d3hcppa1ebcqsj.cloudfront.net/'));
        const address = title.split(' au ')[1];
        const priceAndChargeText = document.querySelector('p.pl-2.my-auto').textContent.trim();
        const priceMatch = priceAndChargeText.match(/(\d+,\d+)€\/mois/);
        let price = priceMatch ? priceMatch[1] : "";
        const chargeMatch = priceAndChargeText.match(/Dont (\d+ €) de charges/);
        let charge = chargeMatch ? chargeMatch[1] : "";
        price = price.split(',')[0];
        charge = charge.replace(' €', '').trim();   
        const amenities = [...document.querySelectorAll('.scrolling-wrapper .essentialname')]
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
            price, 
            charge,
            description,
            features,
            chargesDetails,
            furnitureDetails,
            measuresDetails,
        };
    });

    await page.close(); 
    return { ...data, link: url };}

(async () => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${previousDate}.json`);
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = []; // Si le fichier du jour précédent n'existe pas
    }

    const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Flatlooker_Recherche_Up_To_Date/Updated_Data_Flatlooker_Recherche_${currentDate}.json`);
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = [];

    const browser = await puppeteer.launch();

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(browser, annonce.url);
            allData.push(data); 
            console.log('Annonce traitée');
            console.log(`Nombre total d'annonces traitées: ${allData.length}`);
        } catch (error) {
            console.error(`Échec du scraping de la page à l'URL ${annonce.url} : ${error}`);
        }
    }

    await browser.close();

    let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
    if (previousData.length === 0) {
        console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
        upToDateAnnouncements = allData;
        newAnnouncements = [];
        removedAnnouncements = [];
    } else {
        newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.link === item.link));
        upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
    }

    const fileName = path.join(__dirname, `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Flatlooker_Annonce_Up_To_Date/Updated_Data_Flatlooker_Annonces_${currentDate}.json`);

    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

    console.log(`Toutes les données ont été sauvegardées dans ${fileName} !`);
    console.log(`TOTAL_NOUVELLES_ANNONCES : ${newAnnouncements.length} nouvelles annonces sur Flatlooker.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
})();