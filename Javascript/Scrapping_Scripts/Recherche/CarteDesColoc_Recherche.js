const puppeteer = require('puppeteer');
const fs = require('fs');

async function interceptXHRRequests(url, city) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log(`Ouverture de la page : ${url}`);

    let allData = [];

    // Écouter les réponses XHR et enregistrer les réponses JSON
    page.on('response', async response => {
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/json') && response.url().includes('listing_search/list_results')) {
            try {
                const json = await response.json();
                if (json && typeof json.results === 'string') {
                    json.results = JSON.parse(json.results);
                }
                allData.push(...json.results);
            } catch (error) {
                console.error('Erreur lors du traitement de la réponse JSON:', error);
            }
        }
    });

    await page.goto(url);

    // Scroller jusqu'à ce qu'il n'y ait plus de nouvelles annonces à charger
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    while (true) {
      await page.evaluate('window.scrollBy(0, 1000)'); // Défilement progressif
      await page.waitForTimeout(4000); // Augmentation du délai d'attente

      let newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === lastHeight) {
          break; // Arrêter le défilement si on atteint le bas de la page
      }
      lastHeight = newHeight;
  }

    // Sauvegarde des données collectées
    const filename = `data_${city}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 4));
    console.log(`Le JSON pour ${city} a été sauvegardé dans ${filename}`);

    console.log(`Fermeture du navigateur pour ${city}`);
    await browser.close();
}

function getJson(url, city) {
    console.log(`Début du scrap de ${city}...`);
    const startTime = new Date().getTime();

    interceptXHRRequests(url, city).then(() => {
        const endTime = new Date().getTime();
        console.log(`${city} bien scrappé en ${(endTime - startTime) / 1000} secondes`);
    });
}

// Exemple d'utilisation
getJson('https://www.lacartedescolocs.fr/logements/fr/ile-de-france', 'Paris');
