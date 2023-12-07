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

async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' }); // Attendez que le réseau soit inactif

    const data = await page.evaluate(() => {
        const imageElements = document.querySelectorAll('#pictures a[data-fancybox="housing"]');
        const images = Array.from(imageElements).map(a => a.getAttribute('data-src'));
        const title = document.querySelector('.item.title h1')?.textContent.trim();
        const virtualTourLinkElement = document.querySelector('.wrap.links a[data-type="iframe"]');
        const virtualTour = virtualTourLinkElement ? virtualTourLinkElement.getAttribute('data-src') : null;
        const publicationDate = document.querySelector('.item.title .flex.grey:nth-child(2)')?.textContent.trim();
        const address = document.querySelector('.item.title .flex.grey')?.textContent.trim();
        const servicesElements = document.querySelectorAll('.item.services .service span');
        const amenities = Array.from(servicesElements).map(span => span.textContent.trim());
        const description = document.querySelector('.item.description p')?.innerHTML.trim(); // Utilise innerHTML pour conserver les sauts de ligne
        const schoolSection = document.querySelector('.item.school');
        const schoolLinks = schoolSection.querySelectorAll('ul li a');
        const nearTo = Array.from(schoolLinks).map(a => {
            return {
                name: a.textContent.trim(),
                link: a.getAttribute('href')
            };
        });
        const area = document.querySelector('#partial-advert-price h2')?.childNodes[0].textContent.trim();
        const price = document.querySelector('#partial-advert-price .price')?.textContent.trim();
        const disponibility = document.querySelector('h3')?.textContent.trim();
        const charges = document.querySelector('#partial-advert-description strong:first-child')?.textContent.trim();
        const agencyFees = document.querySelector('#partial-advert-description span.grey:nth-of-type(2)')?.nextSibling.textContent.trim();
        const deposit = document.querySelector('#partial-advert-description strong:last-child')?.textContent.trim();
        
        return {
            images,
            title,
            virtualTour,
            publicationDate,
            address,
            amenities,
            description,
            nearTo,
            area,
            price,
            charges,
            agencyFees,
            deposit,
            disponibility,
        };
    });

    // La page n'est pas fermée ici, elle sera réutilisée
    return { ...data, link: url };
}

(async () => {
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${previousDate}.json`);
    let previousData;
    try {
        previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
    } catch (error) {
        previousData = []; // Si le fichier du jour précédent n'existe pas
    }

    const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/ImmoJeune_Recherche_Up_To_Date/Updated_Data_ImmoJeune_Recherche_${currentDate}.json`);
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = [];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(page, annonce.link);
            allData.push(data); 
            console.log('Annonce traitée :', annonce.link);
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
        }
    }

    await page.close();
    await browser.close();

    let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
    if (previousData.length === 0) {
        console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
        upToDateAnnouncements = allData;
        newAnnouncements = [];
        removedAnnouncements = [];
    } else {
        newAnnouncements = allData.filter(item => !previousData.some(oldItem => oldItem.link === item.link));
        removedAnnouncements = previousData.filter(item => !allData.some(newItem => newItem.link === item.link));
        upToDateAnnouncements = allData.filter(item => !newAnnouncements.includes(item));
    }

    const fileName = path.join(__dirname, `../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${currentDate}.json`);
    const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/ImmoJeune_Annonce_Up_To_Date/Updated_Data_ImmoJeune_Annonces_${currentDate}.json`);

    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

    console.log(`All data saved to ${fileName}!`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur ImmoJeune.`);
    console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
    console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
})();
