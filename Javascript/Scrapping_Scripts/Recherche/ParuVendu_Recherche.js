const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let allData = [];
    let pageIndex = 1; // Index de page commençant à 1 

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
        pageIndex++; // Incrémente l'index de la page pour la page suivante
    }

    // Choisir le nom et l'emplacement de la sortie du fichier json
    const fileName = `../../Resultat_Recherche/ParuVendu_Recherche/Data_ParuVendu_Recherche_${getCurrentDateString()}.json`;

    // Créer le fichier json
    fs.writeFileSync(fileName, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`Data saved to ${fileName}!`);


    await browser.close();
})();
