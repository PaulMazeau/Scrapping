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

    let currentPage = 1;
    let allData = [];

    while (true) {
        const url = `https://www.morningcroissant.fr/location/paris?type=&guests=${currentPage > 1 ? `&page=${currentPage}` : ''}`;
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

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/MorningCroissant_Recherche/Data_MorningCroissant_Recherche_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/MorningCroissant_Recherche/Data_MorningCroissant_Recherche_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_MorningCroissant_Recherche_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Total scraped items: ${allData.length}`);
    console.log(`Today's data saved to ${outputFileName}`);
    console.log(`${newAnnouncements.length} new item(s).`);
    console.log(`${removedAnnouncements.length} removed item(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} retained item(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);

    await browser.close();
})();
