const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');


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
    return { ...data, link: url };
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();
    const cities = [
        { name: "Paris" },
        { name: "Montreuil" },
        { name: "Cergy" },
        { name: "Lyon" },
        { name: "Villeurbanne" },
        { name: "Saint-Priest" },
        { name: "Bron" },
        { name: "Vénissieux" },
        { name: "Saint-Etienne" },
        { name: "Marseille" },
        { name: "Toulouse" },
        { name: "Bordeaux" },
        { name: "Nantes" },
        { name: "Rennes" },
        { name: "Lille" },
        { name: "Angers" },
        { name: "Grenoble" },
    ];

    const browser = await puppeteer.launch();

    for (const city of cities) {
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Flatlooker_Recherche_Up_To_Date/Updated_Data_Flatlooker_${city.name}_${currentDate}.json`);
        let annonces;
        try {
            annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        } catch (error) {
            console.error(`Échec de la lecture du fichier pour la ville ${city.name}: ${error}`);
            continue; // Passer à la ville suivante si le fichier n'existe pas
        }

        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${city.name}_${previousDate}.json`);
        const previousData = getOldData(previousDataPath)

        const allData = [];

        for (let annonce of annonces) {
            try {
                const data = await scrapePage(browser, annonce.url);
                allData.push(data); 
                console.log(`Annonce traitée pour ${city.name}`);
                await delay(10000); // Délai de 5 secondes
            } catch (error) {
                console.error(`Échec du scraping de la page à l'URL ${annonce.url} : ${error}`);
            }
        }

        const newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        const removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.link === item.link));
        const upToDateAnnouncements = allData.filter(item => previousData.some(oldItem => oldItem.link === item.link));

        const newFileName = path.join(__dirname, `../../Resultat_Annonce/Flatlooker_Annonce/Data_Flatlooker_Annonces_${city.name}_${currentDate}.json`);
        const upToDateFileName = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Flatlooker_Annonce_Up_To_Date/Updated_Data_Flatlooker_Annonces_${city.name}_${currentDate}.json`);

        fs.writeFileSync(newFileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(upToDateFileName, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

        console.log(`Traitement terminé pour la ville ${city.name}. Nouvelles annonces: ${newAnnouncements.length}. Annonces supprimées: ${removedAnnouncements.length}. Annonces mises à jour: ${upToDateAnnouncements.length}`);
    }

    await browser.close();
    console.log('Toutes les villes ont été traitées.');
})();
