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

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

const cities = [
    { name: "Paris", urlSlug: "paris-75" },
    { name: "Lyon", urlSlug: "lyon-69" },
    { name: "Montreuil", urlSlug: "montreuil-93" },
    { name: "Cergy", urlSlug: "cergy-95" },
    { name: "Villeubarnne", urlSlug: "villeubarnne-69" },
    { name: "Bron", urlSlug: "bron-69" },
    { name: "Venissieux", urlSlug: "venissieux-69200" },
    { name: "Saint-Etienne", urlSlug: "saint-etienne-42" },
    { name: "Marseille", urlSlug: "marseille-13" },
    { name: "Toulouse", urlSlug: "toulouse-31" },
    { name: "Bordeaux", urlSlug: "bordeaux-33" },
    { name: "Nantes", urlSlug: "nantes-44" },
    { name: "Rennes", urlSlug: "rennes-35" },
    { name: "Angers", urlSlug: "angers-49" },
    { name: "Grenoble", urlSlug: "grenoble-38" },
];


(async () => {
    const browser = await puppeteer.launch();

    for (const city of cities) {
        const page = await browser.newPage();
        const url = `https://www.immojeune.com/location-etudiant/${city.urlSlug}.html`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Logique de scrapping pour chaque ville

        const currentDate = getCurrentDateString();
        const previousDateString = getCurrentDateString(new Date(new Date().setDate(new Date().getDate() - 1)));

        const oldFileName = path.join(__dirname, `../../Resultat_Recherche/ImmoJeune_Recherche/Data_ImmoJeune_Recherche_${city.name}_${previousDateString}.json`);
        const oldData = getOldData(oldFileName);

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

    const newAnnouncements = allData.filter(item => !oldData.some(oldItem => oldItem.link === item.link));
        const removedAnnouncements = oldData.filter(oldItem => !allData.some(newItem => newItem.link === oldItem.link));
        const updatedData = allData.filter(item => !removedAnnouncements.some(removedItem => removedItem.link === item.link));

        const outputFileName = path.join(__dirname, `../../Resultat_Recherche/ImmoJeune_Recherche/Data_ImmoJeune_Recherche_${city.name}_${currentDate}.json`);
        const updatedFileName = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/ImmoJeune_Recherche_Up_To_Date/Updated_Data_ImmoJeune_Recherche_${city.name}_${currentDate}.json`);

        fs.writeFileSync(outputFileName, JSON.stringify(allData, null, 2), 'utf-8');
        fs.writeFileSync(updatedFileName, JSON.stringify(updatedData, null, 2), 'utf-8');

        console.log(`Total scraped ads for ${city.name}: ${allData.length}`);
        console.log(`Today's data for ${city.name} saved to ${outputFileName}`);
        console.log(`TOTAL_NOUVELLES_ANNONCES for ${city.name}: ${newAnnouncements.length} new ads.`);
        console.log(`${removedAnnouncements.length} removed ad(s) for ${city.name}.`);
        console.log(`${updatedData.length - newAnnouncements.length} retained ad(s) for ${city.name}.`);
        console.log(`Updated data for ${city.name} saved to ${updatedFileName}`);

        await page.close();

        await delay(60000); // Délai de 1 minute
    }

    await browser.close();
})();
