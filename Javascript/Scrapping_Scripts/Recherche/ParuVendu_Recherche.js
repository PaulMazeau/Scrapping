const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const cities = {
    "Paris": "75000", "Montreuil": "93048", "Cergy": "95XX0", "Lyon": "69000",
    "Villeurbanne": "69266", "Saint-Priest": "69290", "Bron": "69029", "Vénissieux": "69259",
    "Saint-Etienne": "42XX0", "Marseille": "13000", "Toulouse": "31XX0", "Bordeaux": "33XX0",
    "Nantes": "44XX0", "Rennes": "35XX0", "Lille": "59XX1", "Angers": "49XX0", "Grenoble": "38XX0"
};

(async () => {
    const browser = await puppeteer.launch();
    const currentDate = getCurrentDateString();
    const previousDate = getPreviousDateString();

    for (const [city, codeINSEE] of Object.entries(cities)) {
        const page = await browser.newPage();
        let allData = [];
        let pageIndex = 1;

        while (true) {
            const url = `https://www.paruvendu.fr/immobilier/annonceimmofo/liste/listeAnnonces?tt=5&at=1&nbp0=99&codeINSEE=,${codeINSEE},${pageIndex > 1 ? `&p=${pageIndex}` : ''}`;

            await page.goto(url, { waitUntil: 'networkidle2' });

            const data = await page.evaluate(() => {
            const cards = [...document.querySelectorAll('div[data-id]')];

            return cards.map(card => {
                const imageUrl = card.querySelector('.img img')?.src || "";
                const price = card.querySelector('.text-lg div')?.textContent.trim() || "";
                const title = card.querySelector('h3')?.textContent.trim() || "";
                const details = [...card.querySelectorAll('.flex.flex-wrap.gap-x-2.gap-y-1.items-center.text-xs.font-medium span')]
                    .map(span => span.textContent.trim())
                    .join(' | ');
                const description = card.querySelector('.text-sm.text-justify.line-clamp-5')?.textContent.trim() || "";
                const link = card.querySelector('a[href^="/immobilier"]')?.href || "";

                return {
                    imageUrl,
                    price,
                    title,
                    details,
                    description,
                    link
                };
            });
        });

        if (data.length < 25) {
            break;
        }

        allData.push(...data);
        pageIndex++;
    }

    console.log(allData.length)

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/ParuVendu_Recherche/Data_ParuVendu_Recherche_${city}_${previousDate}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/ParuVendu_Recherche/Data_ParuVendu_Recherche_${city}_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/ParuVendu_Recherche_Up_To_Date/Updated_Data_ParuVendu_Recherche_${city}_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Total scraped ads for ${city}: ${allData.length}`);
    console.log(`New ads for ${city}: ${newAnnouncements.length}`);
    console.log(`Removed ads for ${city}: ${removedAnnouncements.length}`);
    console.log(`Updated ads for ${city}: ${updatedData.length}`);
    console.log(`Data saved to ${outputFileName}`);

    await page.close();
}

await browser.close();
})();