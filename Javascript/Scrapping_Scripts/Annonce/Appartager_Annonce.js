const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');


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
    const previousDateString = getPreviousDateString();
    const cities = [
        { name: "Paris",},
        { name: "Montreuil",},
        { name: "Cergy",},
        { name: "Lyon",},
        { name: "Villeurbanne",},
        { name: "Saint-Priest",},
        { name: "Bron",},
        { name: "Vénissieux",},
        { name: "Saint-Etienne",},
        { name: "Marseille",},
        { name: "Toulouse",},
        { name: "Bordeaux",},
        { name: "Nantes",},
        { name: "Rennes",},
        { name: "Lille",},
        { name: "Angers",},
        { name: "Grenoble",},
    ];

    const browser = await puppeteer.launch();

    for (const city of cities) {
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Appartager_Recherche_Up_To_Date/Updated_Data_Appartager_Recherche_${city.name}_${currentDate}.json`);
        let annonces;
        try {
            annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        } catch (error) {
            console.error(`Échec de la lecture du fichier pour la ville ${city.name}: ${error}`);
            continue;
        }

        const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${city.name}_${previousDateString}.json`);
        const previousData = getOldData(previousDataPath);

        const allData = [];

        for (let annonce of annonces) {
            try {
                const data = await scrapePage(browser, annonce.link);
                allData.push(data);
                console.log(`Annonce traitée pour ${city.name}`);
            } catch (error) {
                console.error(`Échec du scraping de la page à l'URL ${annonce.link} : ${error}`);
            }
        }

        const newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        const removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.link === item.link));
        const upToDateAnnouncements = allData.filter(item => previousData.some(oldItem => oldItem.link === item.link));

        const fileName = path.join(__dirname, `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${city.name}_${currentDate}.json`);
        const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Appartager_Annonce_Up_To_Date/Updated_Data_Appartager_Annonces_${city.name}_${currentDate}.json`);

        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

        console.log(`Traitement terminé pour la ville ${city.name}. Nouvelles annonces: ${newAnnouncements.length}. Annonces supprimées: ${removedAnnouncements.length}. Annonces mises à jour: ${upToDateAnnouncements.length}`);
    }

    await browser.close();
})();
    
