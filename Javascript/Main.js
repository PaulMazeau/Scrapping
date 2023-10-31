// main.js
const { exec } = require('child_process');

const scripts = [
  './Scrapping_Scripts/Recherche/Appartager_Recherche',
  './Scrapping_Scripts/Recherche/BienIci_Recherche',
  './Scrapping_Scripts/Recherche/Coliving_Recherche',
  './Scrapping_Scripts/Recherche/ImmoJeune_Recherche',
  './Scrapping_Scripts/Recherche/Koliving_Recherche',
  './Scrapping_Scripts/Recherche/MorningCroissant_Recherche',
  './Scrapping_Scripts/Recherche/ParuVendu_Recherche',
  './Scrapping_Scripts/Recherche/Roomster_Recherche'
];

async function runScript(script) {
  return new Promise((resolve, reject) => {
    const process = exec(`node ${script}`, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Erreur avec le script ${script}:`, stderr);
        reject(error);
      } else {
        console.log(`Script ${script} terminé avec succès.`);
        resolve(stdout);
      }
    });
  });
}

Promise.allSettled(scripts.map(runScript))
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Le script ${scripts[index]} a réussi.`);
      } else {
        console.log(`Le script ${scripts[index]} a échoué.`);
      }
    });
  });
