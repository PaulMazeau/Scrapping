const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    console.log("Démarrage de Puppeteer...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    page.on('response', async (response) => {
        const url = response.url();
        const isJsonResponse = response.headers()['content-type']?.includes('application/json');
        console.log("Réponse détectée:", url);

        if (isJsonResponse) {
            try {
                const jsonResponse = await response.json();
                console.log("Réponse JSON interceptée à:", url);
                const filePath = `./response_${Date.now()}.json`;
                await fs.writeFile(filePath, JSON.stringify(jsonResponse, null, 2));
                console.log(`Réponse JSON sauvegardée dans le fichier: ${filePath}`);
            } catch (e) {
                console.error("Erreur lors de la tentative de parsing JSON:", e);
            }
        }
    });

    console.log("Navigation vers l'URL...");
    await page.goto('https://www.lacartedescolocs.fr/logements/fr/paris', { waitUntil: 'networkidle2' });

    console.log("Attente de réponses réseau...");
    await page.waitForTimeout(10000);

    console.log("Fermeture de Puppeteer...");
    await browser.close();
})();
