const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    // Choisir le nom et l'emplacement de la sortie du fichier json
    const fileName = `../../Resultat_Recherche/ImmoJeune_Recherche/Data_ImmoJeune_Recherche_${getCurrentDateString()}.json`;

    // Créer le fichier json
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`Data saved to ${fileName}!`);

    await browser.close();
})();
