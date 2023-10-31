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

    let allData = [];
    let pageIndex = 1;

    while (true) {
        const url = pageIndex === 1
            ? 'https://www.paruvendu.fr/immobilier/annonceimmofo/liste/listeAnnonces?tt=5&at=1&nbp0=99&pa=FR&lo=75&codeINSEE='
            : `https://www.paruvendu.fr/immobilier/annonceimmofo/liste/listeAnnonces?tt=5&at=1&nbp0=99&pa=FR&lo=75&codeINSEE=&p=${pageIndex}`;

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
        })

        console.log(`Scrapped ${data.length} ads from ${url}`);

        if (data.length < 25) {
            break;
        }

        allData.push(...data);
        pageIndex++;
    }

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/ParuVendu_Recherche/Data_ParuVendu_Recherche_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/ParuVendu_Recherche/Data_ParuVendu_Recherche_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_ParuVendu_Recherche_${currentDate}.json`);

    fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
    fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

    console.log(`Total scraped ads: ${allData.length}`);
    console.log(`Today's data saved to ${outputFileName}`);
    console.log(`${newAnnouncements.length} new ad(s).`);
    console.log(`${removedAnnouncements.length} removed ad(s).`);
    console.log(`${updatedData.length - newAnnouncements.length} retained ad(s).`);
    console.log(`Updated data saved to ${updatedFileName}`);

    await browser.close();
})();
