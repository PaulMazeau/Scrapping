const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(browser, url) {
    const page = await browser.newPage();
    await page.goto(url);

    const data = await page.evaluate(() => {
        const imageLinks = _sr.page.photos.map(photoObj => photoObj.photo);
        const price = document.querySelector(".pricing-box__price")?.textContent.trim() || "";
        const roomPrice = document.querySelector(".pricing-box__room")?.textContent.trim() || "";
        const features = [...document.querySelectorAll('.property-feature-list__text')].map(el => el.textContent.trim());
        const detailsAboutRoommates = [...document.querySelectorAll('.listing-detail__content-box .feature-list dt, .listing-detail__content-box .feature-list dd')].map(el => el.textContent.trim());
        const description = document.querySelector(".listing-detail__content-box .heading + div")?.textContent.trim() || "";
        const adReference = document.querySelector(".listing-detail__content-box:last-child")?.textContent.trim() || "";
        const heading = document.querySelector(".listing-detail__listing-heading")?.textContent.trim() || "";
        const address = document.querySelector(".listing-detail__listing-header p.small-text")?.textContent.trim() || "";

        return {
            imageLinks,
            price,
            roomPrice,
            features,
            detailsAboutRoommates: detailsAboutRoommates.reduce((acc, curr, idx, srcArr) => {
                if (idx % 2 === 0) {
                    acc[curr] = srcArr[idx + 1];
                }
                return acc;
            }, {}),
            description,
            adReference,
            heading,
            address
        };
    });

    await page.close(); // Fermez l'onglet après le scraping
    return data;
}

(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/Appartager_Recherche_Up_To_Date/Updated_Data_Appartager_Recherche_${getCurrentDateString()}.json`;
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

    // Créer un nom de fichier basé sur la date actuelle
    const fileName = `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8'); // Écrire toutes les données dans un seul fichier
    console.log(`All data saved to ${fileName}!`);
})();
