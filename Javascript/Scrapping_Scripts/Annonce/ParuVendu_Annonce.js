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

async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
        const description = document.querySelector('.im12_txt_ann_auto')?.textContent.trim() +
                            document.querySelector('#txtAnnonceTrunc')?.innerHTML.trim();
        const imageElements = document.querySelectorAll('.autodet15-ConteneurMiniGlob img');
        const images = Array.from(imageElements).map(img => img.src);
        const title = document.querySelector('#detail_h1')?.textContent.trim().replace(/\s+/g, ' ');
        const city = document.querySelector('#detail_loc')?.textContent.trim();
        const featuresElements = document.querySelectorAll('.cotea16-mes ul.crit-alignbloc li');
        const amenities = Array.from(featuresElements).map(li => li.textContent.trim());
        const featuresList = document.querySelector('.cotea16-mes ul.crit-alignbloc');
        const updateDateElement = featuresList ? featuresList.lastElementChild.querySelector('span') : null;
        const updateDate = updateDateElement ? updateDateElement.textContent.trim() : null;

        const priceElement = document.querySelector('#autoprix');
        let price = priceElement ? priceElement.textContent.trim() : '';
        
        // Nettoyez le texte pour enlever tout ce qui n'est pas numérique ou espace
        price = price.replace(/[^\d\s]/g, '').trim();
        
        return {
            description,
            images,
            title,
            city,
            amenities, 
            updateDate,
            price
        };
    });

    return { ...data, link: url };
}

const cities = [
    { name: "Paris", code: "75000" },
    { name: "Montreuil", code: "93048" },
    { name: "Cergy", code: "95XX0" },
];

(async () => {
    const browser = await puppeteer.launch();
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    for (let city of cities) {
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/ParuVendu_Recherche_Up_To_Date/Updated_Data_ParuVendu_Recherche_${city.name}_${currentDate}.json`);
        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${city.name}_${previousDate}.json`);
        let previousData;
        try {
            previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
        } catch (error) {
            previousData = []; // Si le fichier du jour précédent n'existe pas
        }

        let annonces;
        try {
            annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        } catch (error) {
            console.error(`Erreur de lecture des annonces pour ${city.name}:`, error);
            continue; // Passez à la ville suivante si les annonces ne peuvent être chargées
        }

        const allData = [];
        const page = await browser.newPage();

        for (let annonce of annonces) {
            try {
                const data = await scrapePage(page, annonce.link);
                allData.push(data); 
                console.log('Annonce traitée :', annonce.link);
            } catch (error) {
                console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
            }
        }

        await page.close();

    let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
    if (previousData.length === 0) {
        console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
        upToDateAnnouncements = allData;
        newAnnouncements = [];
        removedAnnouncements = [];
    } else {
        newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.city === item.city));
        removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.title === newItem.title && newItem.city === item.city));
        upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
    }

    const fileName = path.join(__dirname, `../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${city.name}_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/ParuVendu_Annonce_Up_To_Date/Updated_Data_ParuVendu_Annonces_${city.name}_${currentDate}.json`);

    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

    console.log(`All data saved for ${city.name} to ${fileName}!`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur ParuVendu pour ${city.name}.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city.name}.`);
}

await browser.close();
})();