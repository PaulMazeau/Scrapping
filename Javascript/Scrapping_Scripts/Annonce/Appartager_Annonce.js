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
    await page.goto(url);

    const data = await page.evaluate(() => {
        const images = _sr.page.photos.map(photoObj => photoObj.photo);
        const price = document.querySelector(".pricing-box__price")?.textContent.trim() || "";
        const roomPrice = document.querySelector(".pricing-box__room")?.textContent.trim() || "";
        const features = [...document.querySelectorAll('.property-feature-list__text')].map(el => el.textContent.trim());
        const detailsAboutRoommates = [...document.querySelectorAll('.listing-detail__content-box .feature-list dt, .listing-detail__content-box .feature-list dd')].map(el => el.textContent.trim());
        const description = document.querySelector(".listing-detail__content-box .heading + div")?.textContent.trim() || "";
        const adReference = document.querySelector(".listing-detail__content-box:last-child")?.textContent.trim() || "";
        const heading = document.querySelector(".listing-detail__listing-heading")?.textContent.trim() || "";
        const address = document.querySelector(".listing-detail__listing-header p.small-text")?.textContent.trim() || "";

        return {
            images,
            price,
            roomPrice,
            features,
            detailsAboutRoommates: detailsAboutRoommates.reduce((acc, curr, idx, srcArr) => {
                if (idx % 2 === 0) {
                    acc[curr] = srcArr[idx + 1];
                }
                return acc;
            }, {}),
            description,
            adReference,
            heading,
            address
        };
    });

    await page.close();
    return {...data, link: url};}

    (async () => {
        const currentDate = getCurrentDateString();
        const previousDate = getPreviousDateString();
    
        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${previousDate}.json`);
        let previousData;
        try {
            previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
        } catch (error) {
            previousData = []; // Si le fichier du jour précédent n'existe pas
        }
    
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Appartager_Recherche_Up_To_Date/Updated_Data_Appartager_Recherche_${currentDate}.json`);
        const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        const allData = [];
    
        const browser = await puppeteer.launch();
    
        for (let annonce of annonces) {
            try {
                const data = await scrapePage(browser, annonce.link);
                allData.push(data);
                console.log('Annonce traitée');
                console.log(`Nombre total d'annonces traitées: ${allData.length}`);
            } catch (error) {
                console.error(`Échec du scraping de la page à l'URL ${annonce.link} : ${error}`);
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
    
        const fileName = path.join(__dirname, `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${currentDate}.json`);
        const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Appartager_Annonce_Up_To_Date/Updated_Data_Appartager_Annonces_${currentDate}.json`);
    
        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');
    
        console.log(`Toutes les données ont été sauvegardées dans ${fileName} !`);
        console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
        console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
    })();
    
