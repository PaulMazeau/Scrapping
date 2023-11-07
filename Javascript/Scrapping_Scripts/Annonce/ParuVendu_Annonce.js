const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
        const description = document.querySelector('.im12_txt_ann_auto')?.textContent.trim() +
                            document.querySelector('#txtAnnonceTrunc')?.innerHTML.trim();
        const imageElements = document.querySelectorAll('.autodet15-ConteneurMiniGlob img');
        const imageUrls = Array.from(imageElements).map(img => img.src);
        const title = document.querySelector('#detail_h1')?.textContent.trim().replace(/\s+/g, ' ');
        const city = document.querySelector('#detail_loc')?.textContent.trim();
        const featuresElements = document.querySelectorAll('.cotea16-mes ul.crit-alignbloc li');
        const features = Array.from(featuresElements).map(li => li.textContent.trim());
        const updateDateElement = document.querySelector('.cotea16-mes ul.crit-alignbloc li:nth-child(2) span');
        const updateDate = updateDateElement ? updateDateElement.textContent.trim() : null;
        
        return {
            description,
            imageUrls,
            title,
            city,
            features, 
            updateDate
        };
    });

    return data;
}

(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/ParuVendu_Recherche_Up_To_Date/Updated_Data_ParuVendu_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = []; // Pour stocker les données de toutes les annonces

    const browser = await puppeteer.launch();
    const page = await browser.newPage(); // Créez une page une seule fois ici

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(page, annonce.link); // Utilisez la même page pour chaque annonce
            allData.push(data); // Ajoutez les données de l'annonce au tableau
            console.log('Annonce traitée :', annonce.link);
            console.log(allData.length)
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
        }
    }

    await page.close(); // Fermez la page après le traitement de toutes les annonces
    await browser.close(); // Fermez le navigateur après la fermeture de la page

    // Écrivez toutes les données accumulées dans un fichier JSON
    const fileName = `../../Resultat_Annonce/ParuVendu_Annonce/Data_ParuVendu_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`All data saved to ${fileName}!`);
})();
