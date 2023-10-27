const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let offset = 0;
    let allData = [];
    const search_id = '3000001176473'; // Ce sera probablement constant, mais assurez-vous qu'il en soit ainsi

    while (true) { // Cette boucle continue jusqu'à ce qu'il n'y ait plus d'annonces à scraper
        const url = `https://www.appartager.com/location/?offset=${offset}&search_id=${search_id}&sort_by=by_day&mode=list`;
        await page.goto(url, { waitUntil: 'networkidle2' }); // attend jusqu'à ce que les requêtes réseau soient inactives

        const data = await page.evaluate(() => {
            const cards = [...document.querySelectorAll('.result-card')];
        
            return cards.map((card, index) => {
                const imageUrl = card.querySelector('.result-card-media__image')?.src || "";
                const rent = card.querySelector('.result-card-media__rent span:first-child')?.textContent.trim() || "";
                const rentFrequency = card.querySelector('.result-card-media__rent-frequency')?.textContent.trim() || "";
                const photoCount = card.querySelector('.result-card-media__count span[aria-label]')?.textContent.trim() || "";
                const location = card.querySelector(`.result-card-info__main-heading span#adLocation${index}`)?.textContent.trim() || "";
                const membership = card.querySelector('.result-card-info__membership')?.textContent.trim() || "";
                const highlight = card.querySelector('.result-card-info__summary-item--highlight')?.textContent.trim() || "";
                const availability = card.querySelector('.result-card-info__summary-item--availability')?.textContent.trim() || "";
                const roomType = card.querySelector('.result-card-info__summary-item:not(.result-card-info__summary-item--highlight):not(.result-card-info__summary-item--availability):not(.result-card-info__summary-item--membership)')?.textContent.trim() || "";
                const title = card.querySelector('.result-card-info__heading')?.textContent.trim() || "";
                const description = card.querySelector('.result-card-info__description')?.textContent.trim() || "";
                const link = card.querySelector('.result-card__link')?.href || "";
        
                return {
                    imageUrl,
                    rent,
                    rentFrequency,
                    photoCount,
                    location,
                    membership,
                    highlight,
                    availability,
                    roomType,
                    title,
                    description,
                    link
                };
            });
        });        

        console.log(`Scrapped ${data.length} ads from ${url}`); // <-- Ici

        if (data.length < 10) { // Supposons que si la page n'a pas d'annonces, la liste renvoyée sera vide
            break; // Si la liste est vide, sortez de la boucle
        }

        allData.push(...data); // Ajoute les données de cette page à la liste principale
        offset += 10; // Augmente l'offset pour la page suivante
    }

    // Choisir le nom et l'emplacement de la sortie du fichier json
    const fileName = `../../Resultat_Recherche/Appartager_Recherche/Data_Appartager_Recherche_${getCurrentDateString()}.json`;

    // Créer le fichier json
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`Data saved to ${fileName}!`);

    await browser.close();
})();

