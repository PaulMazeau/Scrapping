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
        const images = Array.from(document.querySelectorAll('img.fotorama__img')).map(img => img.src);
        const title = document.querySelector('.upper-content h1 span').textContent.trim();
        const address = document.querySelector('.upper-content p.location').textContent.trim();
        const verified = document.querySelector('.f-row .f-column svg') ? 'Oui' : 'Non';
        const infoElements = Array.from(document.querySelectorAll('.white-container.about .circle p'));
        const descriptionElement = document.querySelector('span[itemprop="description"]');
        const description = descriptionElement ? descriptionElement.textContent.trim() : "";
        const propertyDetails = {};

        infoElements.forEach(element => {
            const label = element.querySelector('.about-label').textContent.trim();
            const value = element.querySelector('.data').textContent.trim();
            propertyDetails[label] = value;
        });
        return {
            images,
            title,
            address,
            verified,
            description,
            propertyDetails,
        };
    });

    await page.close();
    return data;
}


(async () => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${previousDate}.json`);
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = []; // Si le fichier du jour précédent n'existe pas
    }

    const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Rentola_Recherche_Up_To_Date/Updated_Data_Rentola_Recherche_${currentDate}.json`);
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = [];

    const browser = await puppeteer.launch();

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(browser, annonce.link);
            allData.push(data); // Ajouter les données de chaque annonce au tableau
            console.log('Annonce traitée :', annonce.link);
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
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
        newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.title === item.title && oldItem.address === item.address));
        removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.title === newItem.title && newItem.address === item.address));
        upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
    }

    const fileName = path.join(__dirname, `../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Rentola_Annonce_Up_To_Date/Updated_Data_Rentola_Annonces_${currentDate}.json`);

    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

    console.log(`All data saved to ${fileName}!`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Rentola.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
})();