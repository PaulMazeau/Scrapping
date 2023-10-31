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

    const url = 'https://www.immojeune.com/location-etudiant/paris-75.html';
    await page.goto(url, { waitUntil: 'networkidle2' });

    let previousHeight;
    while (true) {
        console.log(`Une nouvelle page a été trouvée`);
        previousHeight = await page.evaluate('document.body.scrollHeight'); // Récupérer la hauteur actuelle de la page
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)'); // Faire défiler jusqu'en bas
        await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {timeout: 3000}).catch(() => {}); // Attendre que la hauteur de la page augmente (nouveau contenu chargé)
        await page.waitForSelector('#loading_bottom', { hidden: true, timeout: 3000 }).catch(() => {}); // Attendre que l'élément de chargement disparaisse

        const newContentLength = await page.evaluate('document.body.scrollHeight');
        if (newContentLength === previousHeight) {
            // Si la hauteur de la page n'a pas changé, cela signifie que nous avons terminé le chargement de toutes les données
            break;
        }
    }

    const allData = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.card.col')];

        return cards.map(card => {
            const images = [...card.querySelectorAll('.slick-card .img-slick')].map(img => img.style.backgroundImage.slice(5, -2));  // Récupère les images de fond et les nettoie
            const link = card.querySelector('.content')?.href || "";
            const agencyAvatar = card.querySelector('.container_avatar img')?.src || "";
            const agencyName = card.querySelector('.container_avatar img')?.alt || "";
            const title = card.querySelector('.title')?.textContent.trim() || "";
            const description = card.querySelector('.description')?.textContent.trim() || "";
            const details = card.querySelector('.content p:last-of-type')?.textContent.trim() || "";
            const location = card.querySelector('.geo')?.textContent.trim() || "";

            return {
                images,
                link,
                agencyAvatar,
                agencyName,
                title,
                description,
                details,
                location
            };
        });
    });

    console.log(`Scrapped ${allData.length} ads from ${url}`);

    const currentDate = getCurrentDateString();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${String(previousDate.getDate()).padStart(2, '0')}`;

    const oldFileName = path.join(__dirname, `../../Resultat_Recherche/ImmoJeune_Recherche/Data_ImmoJeune_Recherche_${previousDateString}.json`);
    const oldData = getOldData(oldFileName);

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
    const removedAnnouncements = oldData.filter(item => !allData.some(newItem => newItem.link === item.link));
    const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

    const outputFileName = path.join(__dirname, `../../Resultat_Recherche/ImmoJeune_Recherche/Data_ImmoJeune_Recherche_${currentDate}.json`);
    const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_ImmoJeune_Recherche_${currentDate}.json`);

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
