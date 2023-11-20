const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
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
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/Rentola_Recherche_Up_To_Date/Updated_Data_Rentola_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = []; // Initialiser le tableau pour stocker les données de toutes les annonces

    const browser = await puppeteer.launch(); // Ouvrir un seul navigateur

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(browser, annonce.link);
            allData.push(data); // Ajouter les données de chaque annonce au tableau
            console.log('Annonce faite')
            console.log(allData.length)
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
        }
    }

    await browser.close(); // Fermez le navigateur une fois toutes les pages visitées

    const fileName = `../../Resultat_Annonce/Rentola_Annonce/Data_Rentola_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8'); // Écrire toutes les données dans un seul fichier
    console.log(`All data saved to ${fileName}!`);
})();
