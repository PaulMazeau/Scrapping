const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Modifié pour utiliser la même page pour chaque annonce
async function scrapePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0' }); // Attendez que le réseau soit inactif

    const data = await page.evaluate(() => {
        const imageElements = document.querySelectorAll('#pictures a[data-fancybox="housing"]');
        const images = Array.from(imageElements).map(a => a.getAttribute('data-src'));
        const title = document.querySelector('.item.title h1')?.textContent.trim();
        const virtualTourLinkElement = document.querySelector('.wrap.links a[data-type="iframe"]');
        const virtualTour = virtualTourLinkElement ? virtualTourLinkElement.getAttribute('data-src') : null;
        const publicationDate = document.querySelector('.item.title .flex.grey:nth-child(2)')?.textContent.trim();
        const address = document.querySelector('.item.title .flex.grey')?.textContent.trim();
        const servicesElements = document.querySelectorAll('.item.services .service span');
        const amenities = Array.from(servicesElements).map(span => span.textContent.trim());
        const description = document.querySelector('.item.description p')?.innerHTML.trim(); // Utilise innerHTML pour conserver les sauts de ligne
        const schoolSection = document.querySelector('.item.school');
        const schoolLinks = schoolSection.querySelectorAll('ul li a');
        const nearTo = Array.from(schoolLinks).map(a => {
            return {
                name: a.textContent.trim(),
                link: a.getAttribute('href')
            };
        });
        const area = document.querySelector('#partial-advert-price h2')?.childNodes[0].textContent.trim();
        const price = document.querySelector('#partial-advert-price .price')?.textContent.trim();
        const disponibility = document.querySelector('h3')?.textContent.trim();
        const charges = document.querySelector('#partial-advert-description strong:first-child')?.textContent.trim();
        const agencyFees = document.querySelector('#partial-advert-description span.grey:nth-of-type(2)')?.nextSibling.textContent.trim();
        const deposit = document.querySelector('#partial-advert-description strong:last-child')?.textContent.trim();
        
        return {
            images,
            title,
            virtualTour,
            publicationDate,
            address,
            amenities,
            description,
            nearTo,
            area,
            price,
            charges,
            agencyFees,
            deposit,
            disponibility,
        };
    });

    // La page n'est pas fermée ici, elle sera réutilisée
    return data;
}

(async () => {
    const annoncesPath = `../../Resultat_Recherche/Up_To_Date_Recherche/ImmoJeune_Recherche_Up_To_Date/Updated_Data_ImmoJeune_Recherche_${getCurrentDateString()}.json`;
    const annonces = JSON.parse(fs.readFileSync(annoncesPath, 'utf-8'));
    const allData = []; // Pour stocker les données de toutes les annonces

    const browser = await puppeteer.launch();
    const page = await browser.newPage(); // Créez une page une seule fois ici

    for (let annonce of annonces) {
        try {
            const data = await scrapePage(page, annonce.link); // Utilisez la même page pour chaque annonce
            allData.push(data); // Ajoutez les données de l'annonce au tableau
            console.log('Annonce traitée :', annonce.link);
            console.log(allData.length)
        } catch (error) {
            console.error(`Failed to scrape the page at ${annonce.link} due to: ${error}`);
        }
    }

    await page.close(); // Fermez la page après le traitement de toutes les annonces
    await browser.close(); // Fermez le navigateur après la fermeture de la page

    // Écrivez toutes les données accumulées dans un fichier JSON
    const fileName = `../../Resultat_Annonce/ImmoJeune_Annonce/Data_ImmoJeune_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`All data saved to ${fileName}!`);
})();
