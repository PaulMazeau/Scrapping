const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
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

const cities = [
    { name: "Paris", urlSlug: "paris-75" },
    { name: "Lyon", urlSlug: "lyon-69" },
    { name: "Montreuil", urlSlug: "montreuil-93" },
    { name: "Cergy", urlSlug: "cergy-95" },
    { name: "Villeubarnne", urlSlug: "villeubarnne-69" },
    { name: "Bron", urlSlug: "bron-69" },
    { name: "Venissieux", urlSlug: "venissieux-69200" },
    { name: "Saint-Etienne", urlSlug: "saint-etienne-42" },
    { name: "Marseille", urlSlug: "marseille-13" },
    { name: "Toulouse", urlSlug: "toulouse-31" },
    { name: "Bordeaux", urlSlug: "bordeaux-33" },
    { name: "Nantes", urlSlug: "nantes-44" },
    { name: "Rennes", urlSlug: "rennes-35" },
    { name: "Angers", urlSlug: "angers-49" },
    { name: "Grenoble", urlSlug: "grenoble-38" },
];

(async () => {
    const currentDate = getCurrentDateString();
    const previousDateString = getPreviousDateString;

    const browser = await puppeteer.launch();
    
    for (const city of cities) {
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/ImmoJeune_Recherche_Up_To_Date/Updated_Data_ImmoJeune_Recherche_${city.name}_${currentDate}.json`);
        const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
        const allData = [];
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

        const oldFileName = path.join(__dirname, `../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${city.name}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

        let newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
        let removedAnnouncements = oldData.filter(oldItem => !allData.some(newItem => newItem.link === oldItem.link));
        let updatedAnnouncements = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

        const fileName = path.join(__dirname, `../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${city.name}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/ImmoJeune_Annonce_Up_To_Date/Updated_Data_ImmoJeune_Annonces_${city.name}_${currentDate}.json`);

        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedAnnouncements, null, 2), 'utf-8');

        console.log(`Total scraped ads for ${city.name}: ${allData.length}`);
        console.log(`TOTAL_NOUVELLES_ANNONCES for ${city.name}: ${newAnnouncements.length} new ads.`);
        console.log(`${removedAnnouncements.length} removed ad(s) for ${city.name}.`);
        console.log(`Updated data for ${city.name} saved to ${updatedFileName}`);

        await delay(60000);
    }

    await browser.close();
})();