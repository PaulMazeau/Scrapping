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

const cities = [
    "Paris", "Montreuil", "Cergy",
    "Lyon", "Villeurbanne", "Saint-Priest", "Bron", "Vénissieux",
    "Saint-Etienne", "Marseille", "Toulouse",
    "Bordeaux", "Nantes", "Rennes", "Lille", "Angers", "Grenoble"
];

(async () => {
    const browser = await puppeteer.launch();
    const currentDate = getCurrentDateString();
    const previousDateString = getPreviousDateString();

    for (const city of cities) {
        const page = await browser.newPage();
        const urlSlug = city.toLowerCase().replace(' ', '-');
        let currentPage = 1;
        let allData = [];
    
        while (true) {
            const url = `https://www.morningcroissant.fr/location/${urlSlug}?type=&guests=${currentPage > 1 ? `&page=${currentPage}` : ''}`;
            await page.goto(url, { waitUntil: 'networkidle2' });


        const data = await page.evaluate(() => {
            const listItems = [...document.querySelectorAll('.flats-list-item')];

            return listItems.map(listItem => {
                const images = [...listItem.querySelectorAll('.flat-carousel-list span')].map(span => span.getAttribute('data-url'));
                const title = listItem.querySelector('.flat-link')?.textContent || "";
                const link = listItem.querySelector('.flat-link')?.href || "";
                const price = listItem.querySelector('.flat-price .amount')?.textContent || "";
                const pricePeriod = listItem.querySelector('.flat-price .label-period')?.textContent || "";
                const details = listItem.querySelector('.flat-details')?.textContent.trim() || "";
                const location = listItem.querySelector('.flat-location')?.textContent.trim() || "";
                const ownerAvatar = listItem.querySelector('.owner-data-wrapper img')?.src || "";
                const ownerName = listItem.querySelector('.owner-name')?.textContent || "";
                const ownerRating = listItem.querySelector('.average-rating')?.textContent || "";

                return {
                    images,
                    title,
                    link,
                    price,
                    pricePeriod,
                    details,
                    location,
                    ownerAvatar,
                    ownerName,
                    ownerRating
                };
            });
        });
        console.log(`Scrapped ${data.length} items from ${url}`);

        if (data.length < 24) {
            break;
        }

        allData.push(...data);
        currentPage += 1;
    }

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/MorningCroissant_Recherche/Data_MorningCroissant_Recherche_${city}_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(oldItem => !allData.some(newItem => newItem.link === oldItem.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/MorningCroissant_Recherche/Data_MorningCroissant_Recherche_${city}_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/MorningCroissant_Recherche_Up_To_Date/Updated_Data_MorningCroissant_Recherche_${city}_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Total scraped items for ${city}: ${allData.length}`);
    console.log(`New items for ${city}: ${newAnnouncements.length}`);
    console.log(`Removed items for ${city}: ${removedAnnouncements.length}`);
    console.log(`Updated items for ${city}: ${updatedData.length - newAnnouncements.length}`);
    console.log(`Today's data for ${city} saved to ${outputFileName}`);
    console.log(`Updated data for ${city} saved to ${updatedFileName}`);

    await page.close();
    await delay(60000); // Délai de 1 minute entre chaque ville
}

await browser.close();
})();
