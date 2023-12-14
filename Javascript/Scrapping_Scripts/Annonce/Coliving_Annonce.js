const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getPreviousDateString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(browser, url) {
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
    return {...data, link: url};}

    const cities = [
        { name: "Paris", id: 339 },
        { name: "Lyon", id: 638 },
        { name: "Marseille", id: 492 },
        { name: "Toulouse", id: 939 },
        { name: "Bordeaux", id: 698 },
        { name: "Nantes", id: 1221 },
        { name: "Rennes", id: 3449 },
        { name: "Lille", id: 659 },
        { name: "Angers", id: 3003 },
        { name: "Grenoble", id: 1050 }
    ];

    (async () => {
        const browser = await puppeteer.launch();
    
        for (const city of cities) {
            const currentDate = getCurrentDateString();
            const previousDate = getCurrentDateString(new Date(new Date().setDate(new Date().getDate() - 1)));
    
            const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${city.name}_${previousDate}.json`);
            let previousData;
            try {
                previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
            } catch (error) {
                previousData = [];
            }
    
            const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Coliving_Recherche_Up_To_Date/Updated_Data_Coliving_${city.name}_${currentDate}.json`);
            let annonces;
            try {
                annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
            } catch (error) {
                console.error(`Erreur lors de la lecture du fichier d'annonces pour ${city.name}: ${error}`);
                continue;
            }
    
            const allData = [];
    
            for (let annonce of annonces) {
                try {
                    const data = await scrapePage(browser, annonce.url);
                    allData.push(data);
                    console.log(`Annonce traitée pour ${city.name}`);
                } catch (error) {
                    console.error(`Échec du scraping de l'annonce ${annonce.url} pour ${city.name}: ${error}`);
                }
            }
    
            let newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
            let removedAnnouncements = previousData.filter(oldItem => !allData.some(item => item.link === oldItem.link));
            let upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
    
            const fileName = path.join(__dirname, `../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${city.name}_${currentDate}.json`);
            const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Coliving_Annonce_Up_To_Date/Updated_Data_Coliving_Annonces_${city.name}_${currentDate}.json`);
    
            fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
            fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');
    
            console.log(`Données des annonces pour ${city.name} sauvegardées dans ${fileName}`);
            console.log(`TOTAL_NOUVELLES_ANNONCES pour ${city.name} : ${newAnnouncements.length} nouvelles annonces.`);
            console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city.name}.`);
            console.log(`${upToDateAnnouncements.length} annonce(s) à jour pour ${city.name}.`);
        }
    
        await browser.close();
    })();
    