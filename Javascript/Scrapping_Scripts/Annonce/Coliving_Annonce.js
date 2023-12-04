const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(browser, url, roomsApiUrl) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
        
        const imageAnchors = Array.from(document.querySelectorAll('a[data-fancybox="main"]'));
        const images = imageAnchors.map(anchor => anchor.href);
        const title = document.querySelector('h1')?.textContent.trim() || "";
        const bedrooms = document.querySelector('div.grid > div:nth-child(1) > span')?.textContent.trim() || "";
        const bathrooms = document.querySelector('div.grid > div:nth-child(2) > span')?.textContent.trim() || "";
        const residents = document.querySelector('div.grid > div:nth-child(3) > span')?.textContent.trim() || "";
        const gender = document.querySelector('div.grid > div:nth-child(4) > span')?.textContent.trim() || "";
        const size = document.querySelector('div.grid > div:nth-child(5) > span')?.textContent.trim() || "";
        const minStay = document.querySelector('div.grid > div:nth-child(6) > span')?.textContent.trim() || "";        
        const description = document.querySelector('div.w-full + p')?.textContent.trim() || "";
        const amenitiesElements = document.querySelectorAll('.grid.grid-cols-2.xl\\:grid-cols-3.gap-6.text-sm.text-neutral-700 div.ml-2');
        const amenities = [...amenitiesElements].map(el => el.textContent.trim());
        const virtualTour = document.querySelector('iframe[src*="mpembed.com"]')?.getAttribute('src') || "";
        const address = document.querySelector('.mb-6')?.textContent.trim() || "";
        const price = document.querySelector('span.notranslate.text-2xl')?.textContent.trim() || "";

        const rooms = Array.from(document.querySelectorAll('li.js-room-type-item')).map(room => {
            const title = room.querySelector('h3')?.textContent.trim() || "";
            const details = room.querySelector('div.pb-2.mb-1.border-b.border-gray-200')?.textContent.trim() || "";
            const amenities = room.querySelector('div.text-gray-500')?.textContent.trim().split(' · ') || [];
            const price = room.querySelector('.base-price .notranslate')?.textContent.trim() || ""; 
            const availability = room.querySelector('.text-xs.text-red-600, .text-xs.text-green-700')?.textContent.trim() || "";
            const photoURL = room.querySelector('a[data-fancybox]')?.getAttribute('href') || "";
            let availabilityText = room.querySelector('.text-xs.text-green-700')?.textContent.trim() || "";
            if (!availabilityText) {
                const availablePrefix = room.querySelector('.text-xs.text-red-600')?.textContent.trim() || "";
                const availableDate = room.querySelector('.notranslate.text-xs.text-red-600')?.textContent.trim() || "";
                availabilityText = `${availablePrefix} ${availableDate}`;
            }
        
            return { title, details, amenities, price, availability, photoURL, availability: availabilityText };
        });

        return {
            images,
            title,
            bedrooms,
            price,
            bathrooms,
            residents,
            gender,
            size,
            minStay,
            description,
            amenities,
            rooms,
            virtualTour,
            address,
        };
    });

    await page.close();
    return {...data};
}


(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/Coliving_Recherche_Up_To_Date/Updated_Data_Coliving_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = [];

    const browser = await puppeteer.launch();

    for (let annonce of annonces) {
        try {
            const roomsApiUrl = `https://coliving.com/listing/${annonce.id}/room-availability?location_id=${annonce.locationId}`;
            const data = await scrapePage(browser, annonce.url, roomsApiUrl);
            allData.push(data);
            console.log('Annonce faite');
            console.log(allData.length);
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.url} due to: ${error}`);
        }
    }

    await browser.close();

    const fileName = `../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`All data saved to ${fileName}!`);
})();