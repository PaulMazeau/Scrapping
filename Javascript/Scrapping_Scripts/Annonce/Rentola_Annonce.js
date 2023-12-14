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

function getOldData(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
}

async function acceptCookies(browser) {
    const page = await browser.newPage();
    // Utilisez une URL où vous savez que le pop-up des cookies apparaît
    await page.goto('https://rentola.fr', { waitUntil: 'load' });

    try {
        const acceptButton = await page.$('#acceptButton');
        if (acceptButton) {
            await page.evaluate(button => button.scrollIntoView(), acceptButton);
            await acceptButton.click();
        }
    } catch (error) {
        console.log('Erreur lors de la gestion du pop-up de cookies:', error);
    }

    await page.close();
}

async function scrapePage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });

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
    return { ...data, link: url };
}


const cities = [
    "Paris", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers"
];

(async () => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const browser = await puppeteer.launch();
    await acceptCookies(browser);

    for (const city of cities) {
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Rentola_Recherche_Up_To_Date/Updated_Data_Rentola_Recherche_${city}_${currentDate}.json`);
        const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));

        const allData = [];
        for (let annonce of annonces) {
            try {
                const data = await scrapePage(browser, annonce.link);
                allData.push(data); 
                console.log('Annonce traitée :', annonce.link);
            } catch (error) {
                console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
            }
        }

        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${city}_${previousDate}.json`);
        let previousData = getOldData(previousDataPath);

        let newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        let removedAnnouncements = previousData.filter(oldItem => !allData.some(newItem => newItem.link === oldItem.link));
        let upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));

        const fileName = path.join(__dirname, `../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${city}_${currentDate}.json`);
        const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Rentola_Annonce_Up_To_Date/Updated_Data_Rentola_Annonces_${city}_${currentDate}.json`);

        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

        console.log(`All data saved to ${fileName} for ${city}!`);
        console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Rentola pour ${city}.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city}.`);
        console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city}.`);
    }

    await browser.close();
})();