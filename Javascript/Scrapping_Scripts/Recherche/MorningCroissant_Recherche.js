const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let currentPage = 1; // commencez par la première page
    let allData = [];

    while (true) { 
        const url = `https://www.morningcroissant.fr/location/france?type=&start_date=&end_date=&guests=${currentPage > 1 ? `&page=${currentPage}` : ''}`;
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

        if (data.length < 24) { // Si moins de 24 annonces sont trouvées, nous supposons que nous sommes à la dernière page
            break; // Sortez de la boucle
        }

        allData.push(...data); 
        currentPage += 1; 
    }

    // Choisir le nom et l'emplacement de la sortie du fichier json
    const fileName = `../../Resultat_Recherche/MorningCroissant_Recherche/Data_MorningCroissant_Recherche_${getCurrentDateString()}.json`;

    // Créer le fichier json
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`Data saved to ${fileName}!`);

    await browser.close();
})();
