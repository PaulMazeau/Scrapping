const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to Rentola search page
  await page.goto('https://rentola.fr/location/paris');

  // Wait for the results page to load and display the results.
  const selector = '.property';
  await page.waitForSelector(selector);

  // Extract the results from the page.
  const ads = await page.evaluate(selector => {
    const adNodes = document.querySelectorAll(selector);
    const results = [];
    adNodes.forEach(adNode => {
      const id = adNode.getAttribute('data-controller').split('--')[1];
      const favoriteBtn = adNode.querySelector('.favorite');
      const propertyId = favoriteBtn.getAttribute('data-property-id');
      const togglePath = favoriteBtn.getAttribute('data-toggle-path');
      const images = Array.from(adNode.querySelectorAll('.property-image')).map(img => img.getAttribute('data-src'));
      const location = adNode.querySelector('.location-label').innerText;
      const surface = adNode.querySelector('.prop-value').innerText; // Assuming the first '.prop-value' is the surface
      const rooms = adNode.querySelectorAll('.prop-value')[1].innerText; // Assuming the second '.prop-value' is the rooms
      results.push({
        id,
        propertyId,
        togglePath,
        images,
        location,
        surface,
        rooms
      });
    });
    return results;
  }, selector);

  console.log(`Scraped ${ads.length} ads`);;

  const fileName = `../../Resultat_Recherche/Rentola_Recherche/Data_Rentola_${getCurrentDateString()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(ads, null, 2), 'utf-8');

  console.log(`Data saved to ${fileName}!`);
  await browser.close();
})();
