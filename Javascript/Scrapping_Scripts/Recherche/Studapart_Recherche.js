const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Naviguer vers la page de connexion
    await page.goto('https://www.studapart.com/fr/login');

    // Attendre un peu avant de commencer à taper
    await page.waitForTimeout(2000);

    // Remplir le formulaire avec les identifiants et attendre
    await page.type('input[id="username"]', 'pol.mzeau@gmail.com', { delay: 150 });
    await page.type('input[id="password"]', 'ScrappingBot31+', { delay: 150 });

    // Attendre avant d'appuyer sur le bouton "Se connecter"
    await page.waitForTimeout(3000);

    // Soumettre le formulaire
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // Active l'interception de requêtes
    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
        if (interceptedRequest.url() === 'https://search-api.studapart.com/property' && interceptedRequest.method() === 'POST') {
            // Continuer la requête (vous pouvez aussi la modifier si nécessaire)
            interceptedRequest.continue();
        } else {
            interceptedRequest.continue();
        }
    });

    page.on('response', async (response) => {
        if (response.url() === 'https://search-api.studapart.com/property' && response.status() === 200) {
            const responseData = await response.json();
            fs.writeFileSync('response.json', JSON.stringify(responseData, null, 2));
            console.log('Données sauvegardées dans response.json');
        }
    });

    // Naviguez vers la page de recherche ou effectuez l'action qui déclenchera la requête POST
    // NOTE: Remplacez ceci par l'URL ou l'action appropriée si nécessaire.
    await page.goto('https://www.studapart.com/fr/search/');  // Assurez-vous de remplacer 'YOUR_SEARCH_PAGE_URL'

    // Attendez un moment pour s'assurer que la requête est effectuée et la réponse est sauvegardée
    await page.waitForTimeout(10000); 

    await browser.close();
})();
