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

    (async () => {
        const currentDate = getCurrentDateString();
        const previousDate = getPreviousDateString();
    
        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${previousDate}.json`);
        let previousData;
        try {
            previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
        } catch (error) {
            previousData = []; // Si le fichier du jour précédent n'existe pas
        }
    
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Coliving_Recherche_Up_To_Date/Updated_Data_Coliving_Recherche_${currentDate}.json`);
        const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        const allData = [];
    
        const browser = await puppeteer.launch();
    
        for (let annonce of annonces) {
            try {
                const data = await scrapePage(browser, annonce.url);
                allData.push(data);
                console.log('Annonce traitée');
                console.log(`Nombre total d'annonces traitées: ${allData.length}`);
            } catch (error) {
                console.error(`Échec du scraping de la page à l'URL ${annonce.url} : ${error}`);
            }
        }
    
        await browser.close();
    
        let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
        if (previousData.length === 0) {
            newAnnouncements = [];
            removedAnnouncements = [];
            upToDateAnnouncements = allData;
        } else {
            newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
            removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.link === item.link));
            upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
        }
    
        const fileName = path.join(__dirname, `../../Resultat_Annonce/Coliving_Annonce/Data_Coliving_Annonces_${currentDate}.json`);
        const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Coliving_Annonce_Up_To_Date/Updated_Data_Coliving_Annonces_${currentDate}.json`);
    
        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');
    
        console.log(`Toutes les données ont été sauvegardées dans ${fileName} !`);
        console.log(`TOTAL_NOUVELLES_ANNONCES : ${newAnnouncements.length} nouvelles annonces sur Coliving.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
        console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
    })();
    