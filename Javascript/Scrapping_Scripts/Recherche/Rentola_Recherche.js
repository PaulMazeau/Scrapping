const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeDynamicContent(url, outputPath) {
    // Lancer le navigateur headless
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Aller à l'URL spécifiée
    await page.goto(url, {waitUntil: 'networkidle0'}); // attend que le réseau soit inactif

    // Récupérer le contenu de la page
    const content = await page.content();

    // Fermer le navigateur
    await browser.close();

    // Écrire le contenu dans un fichier .html
    fs.writeFileSync(outputPath, content);
    console.log(`Content saved to ${outputPath}`);
}

// Utilisation de la fonction pour sauvegarder le contenu dans 'output.html'
scrapeDynamicContent('https://rentola.fr/location?location=paris', 'output.html');
