const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getOldData(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return [];
    }
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let offset = 0;
    let allData = [];
    const search_id = '3000001247471';

    while (true) {
        const url = `https://www.appartager.com/location/?offset=${offset}&search_id=${search_id}&sort_by=by_day&mode=list`;
        await page.goto(url, { waitUntil: 'networkidle2' });

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

        console.log(`Scrapped ${data.length} ads from ${url}`);

        if (data.length < 10) {
            break;
        }

        allData.push(...data);
        offset += 10;
    }

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/Appartager_Recherche/Data_Appartager_Recherche_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/Appartager_Recherche/Data_Appartager_Recherche_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Appartager_Recherche_Up_To_Date/Updated_Data_Appartager_Recherche_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Il y a ${allData.length} sur Appartager`);
    console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
    console.log(`${removedAnnouncements.length} removed ad(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} retained ad(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);

    await browser.close();
})();
