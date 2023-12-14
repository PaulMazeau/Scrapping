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

function getOldData(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
}

async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
        const photoElements = document.querySelectorAll('.flat-carousel-list span');
        const images = Array.from(photoElements).map(span => span.getAttribute('data-url'));
        const title = document.querySelector('h1[itemprop="name"]')?.textContent.trim();
        const address = document.querySelector('.location[itemprop="address"]')?.textContent.trim();
        const pieces = document.querySelector('.flat-size span:first-child')?.textContent.trim();
        const size = document.querySelector('.flat-size span:last-child')?.textContent.trim();
        const description = document.querySelector('#product_description .txt p')?.innerHTML.trim();
        const detailsElements = document.querySelectorAll('#product_details .container .left-part ul li, #product_details .container .right-part ul li');
        const details = Array.from(detailsElements).reduce((detailsObj, li) => {
            const key = li.querySelector('.left')?.textContent.trim();
            const value = li.querySelector('.right')?.textContent.trim();
            if (key && value) {
                detailsObj[key] = value;
            }
            return detailsObj;
        }, {});
        const bedDisposalElements = document.querySelectorAll('#flat-beds-disposal ul li');
        const bedDisposal = Array.from(bedDisposalElements).map(li => {
            const room = li.querySelector('.left')?.textContent.trim();
            const beds = li.querySelector('.right')?.textContent.trim();
            return { room, beds };
        });
        const rentDetailsElements = document.querySelectorAll('#product_pricing ul li');
        const rentDetails = Array.from(rentDetailsElements).reduce((detailsObj, li) => {
            const key = li.querySelector('.left')?.textContent.trim().replace(/\s\s+/g, ' ');
            const value = li.querySelector('.right .price')?.textContent.trim();
            if (key && value) {
                detailsObj[key] = value;
            }
            return detailsObj;
        }, {});
        const modalitiesElements = document.querySelectorAll('#product_modalities .container .left-part ul li, #product_modalities .container .right-part ul li');
        const modalities = Array.from(modalitiesElements).reduce((modalitiesObj, li) => {
            const key = li.querySelector('.left')?.textContent.trim().replace(/\s\s+/g, ' ');
            const rightElem = li.querySelector('.right');
            let value;
            if (rightElem.querySelector('a')) {
                value = {
                    text: rightElem.textContent.trim(),
                    link: rightElem.querySelector('a').href
                };
            } else {
                value = rightElem.textContent.trim();
            }

            if (key && value) {
                modalitiesObj[key] = value;
            }
            return modalitiesObj;
        }, {});
        const equipmentElements = document.querySelectorAll('#product_amenities .container div');
        const amenities = Array.from(equipmentElements).map(equip => {
            const name = equip.querySelector('.value')?.textContent.trim();
            const available = equip.classList.contains('ok');
            return { [name]: available };
        });
        const securityElements = document.querySelectorAll('#product_security div');
        const security = Array.from(securityElements).map(element => {
            const name = element.querySelector('.value')?.textContent.trim();
            const isAvailable = element.classList.contains('ok');
            return { [name]: isAvailable };
        });
        const neighborhoodDescription = document.querySelector('#product_house_manual .txt')?.innerHTML.trim();
        const ownerProfileUrl = document.querySelector('#host-contact .circular-picture a.profile')?.getAttribute('href');
        const ownerPictureUrl = document.querySelector('#host-contact .circular-picture img')?.src;
        const ownerType = document.querySelector('#host-contact .contact .profile')?.textContent.trim();
        const memberSince = document.querySelector('#host-contact .information .since')?.textContent.trim();
        const professionalType = document.querySelector('#host-contact .information .type')?.textContent.trim();
        const price = document.querySelector('.base-price .price .amount')?.getAttribute('data-amount');

        return {
            images,
            title,
            address,
            pieces,
            size,
            description,
            details,
            bedDisposal,
            rentDetails,
            modalities,
            amenities,
            security,
            neighborhoodDescription,
            owner: {
                profileUrl: ownerProfileUrl,
                pictureUrl: ownerPictureUrl,
                type: ownerType,
                memberSince,
                professionalType
            },
            price
        };
    });

    return { ...data, link: url };
}

const cities = [
    "Paris", "Montreuil", "Cergy", "Lyon", "Villeurbanne", "Saint-Priest", 
    "Bron", "Vénissieux", "Saint-Etienne", "Marseille", "Toulouse", 
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

(async () => {
    const currentDate = getCurrentDateString();
    const previousDateString = getPreviousDateString();
    const browser = await puppeteer.launch();

    for (const city of cities) {
        const urlSlug = city.toLowerCase().replace(' ', '-');
        const annoncesPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/MorningCroissant_Recherche_Up_To_Date/Updated_Data_MorningCroissant_Recherche_${urlSlug}_${currentDate}.json`);
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

        const oldFileName = path.join(__dirname, `../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${urlSlug}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

        let newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
        let removedAnnouncements = oldData.filter(oldItem => !allData.some(newItem => newItem.link === oldItem.link));
        let updatedAnnouncements = allData.filter(item => !newAnnouncements.includes(item));

        const fileName = path.join(__dirname, `../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${urlSlug}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/MorningCroissant_Annonce_Up_To_Date/Updated_Data_MorningCroissant_Annonces_${urlSlug}_${currentDate}.json`);

        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedAnnouncements, null, 2), 'utf-8');

        console.log(`Total scraped items for ${city}: ${allData.length}`);
        console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur MorningCroissant pour ${city}.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s) pour ${city}.`);
        console.log(`${updatedAnnouncements.length} annonce(s) à jour pour ${city}.`);
    }

    await browser.close();
})();
