const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const fetch = require('node-fetch'); // Assurez-vous d'avoir 'node-fetch' installé
const zlib = require('zlib'); // Utilisé pour la décompression Brotli

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (req.url().includes('lacartedescolocs.fr/listing_search/map_results')) {
      console.log('Requête interceptée:', req.url());
      console.log('Entêtes de requête:', req.headers());
    }
    req.continue();
  });

  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0');

  // Définissez les cookies ici si nécessaire ...

  await page.goto('https://www.lacartedescolocs.fr/');
  await page.waitForSelector('#home_search_form');
  await page.waitForTimeout(2000);

  await page.type('#home_search_input', 'Paris');
  await page.waitForTimeout(4000);

  await page.click('#home_search_submit');
  
  page.waitForResponse('response', async (response) => {
    if (response.url().includes('lacartedescolocs.fr/listing_search/map_results')) {
      try {
        console.log('prout')
        const contentType = response.headers()['content-type'];
        if (contentType.includes('application/json')) {
          let text = await response.text();
          // Décompression Brotli si nécessaire
          if (response.headers()['content-encoding'] === 'br') {
            const buffer = Buffer.from(text, 'binary');
            zlib.brotliDecompress(buffer, async (err, result) => {
              if (err) {
                console.error('Erreur lors de la décompression Brotli:', err);
              } else {
                text = result.toString('utf-8');
                const data = JSON.parse(text);
                console.log('Données JSON:', data);
                // Sauvegarder dans un fichier
                await fs.writeFile('data.json', JSON.stringify(data, null, 2));
              }
            });
          } else {
            const data = JSON.parse(text);
            console.log('Données JSON:', data);
            // Sauvegarder dans un fichier
            await fs.writeFile('data.json', JSON.stringify(data, null, 2));
          }
        } else {
          throw new Error('Réponse non-JSON reçue');
        }
      } catch (error) {
        console.error('Erreur lors du parsing JSON:', error);
      }
    }
  });

})();
