const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
        const photoElements = document.querySelectorAll('.flat-carousel-list span');
        const photoUrls = Array.from(photoElements).map(span => span.getAttribute('data-url'));
        const title = document.querySelector('h1[itemprop="name"]')?.textContent.trim();
        const location = document.querySelector('.location[itemprop="address"]')?.textContent.trim();
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
        const equipments = Array.from(equipmentElements).map(equip => {
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
        const rentAmount = document.querySelector('.base-price .price .amount')?.getAttribute('data-amount');

        return {
            photoUrls,
            title,
            location,
            pieces,
            size,
            description,
            details,
            bedDisposal,
            rentDetails,
            modalities,
            equipments,
            security,
            neighborhoodDescription,
            owner: {
                profileUrl: ownerProfileUrl,
                pictureUrl: ownerPictureUrl,
                type: ownerType,
                memberSince,
                professionalType
            },
            rentAmount
        };
    });

    return data;
}

(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/MorningCroissant_Recherche_Up_To_Date/Updated_Data_MorningCroissant_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = []; // Pour stocker les données de toutes les annonces

    const browser = await puppeteer.launch();
    const page = await browser.newPage(); // Créez une page une seule fois ici

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(page, annonce.link); // Utilisez la même page pour chaque annonce
            allData.push(data); // Ajoutez les données de l'annonce au tableau
            console.log('Annonce traitée :', annonce.link);
            console.log(allData.length)
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
        }
    }

    await page.close(); // Fermez la page après le traitement de toutes les annonces
    await browser.close(); // Fermez le navigateur après la fermeture de la page

    // Écrivez toutes les données accumulées dans un fichier JSON
    const fileName = `../../Resultat_Annonce/MorningCroissant_Annonce/Data_MorningCroissant_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`All data saved to ${fileName}!`);
})();
