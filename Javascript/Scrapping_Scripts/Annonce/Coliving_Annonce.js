const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function fetchRoomDetails(page, roomsApiUrl) {
    return await page.evaluate(async (roomsApiUrl) => {
        try {
            const response = await fetch(roomsApiUrl);
            if (!response.ok) {
                throw new Error(`Error fetching rooms details: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }, roomsApiUrl);
}

async function scrapePage(browser, url, roomsApiUrl) {
    const page = await browser.newPage();
    await page.goto(url);

    // Récupération des détails des chambres
    const roomsDetails = await fetchRoomDetails(page, roomsApiUrl);

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
        const address = document.querySelector('div.text-gray-700')?.textContent.trim() || "";
        const price = document.querySelector('span.x-text')?.textContent.trim() || "";

        // Récupération des informations des chambres disponibles
        const rooms = Array.from(document.querySelectorAll('.js-room-type-item')).map(room => {
            const id = room.getAttribute('data-room-type-id');
            const title = room.querySelector('h3')?.textContent.trim();
            const details = room.querySelectorAll('.pb-2.mb-1.border-b.border-gray-200 span.items-center');
            const amenities = room.querySelectorAll('.text-gray-500 span');
            const images = room.querySelectorAll('.js-col-photos a[href]');
            const price = document.querySelector('span.notranslate.font-bold');            
            const roomDetails = Array.from(details).map(detail => detail.textContent.trim());
            const roomAmenities = Array.from(amenities).map(amenity => amenity.textContent.trim());
            const imageUrls = Array.from(images).map(image => image.getAttribute('href'));
    
            return {
                id,
                title,
                details: roomDetails,
                amenities: roomAmenities,
                images: imageUrls,
                price
            };
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

    await page.close(); // Fermez l'onglet après le scraping
    return {...data, rooms: roomsDetails};
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