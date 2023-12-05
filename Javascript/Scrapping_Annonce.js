const { exec } = require('child_process');

const scripts = [
  './Scrapping_Scripts/Annonce/Appartager_Annonce',
  './Scrapping_Scripts/Annonce/Coliving_Annonce',
  './Scrapping_Scripts/Annonce/Flatlooker_Annonce',
  './Scrapping_Scripts/Annonce/ImmoJeune_Annonce',
  './Scrapping_Scripts/Annonce/Koliving_Annonce',
  './Scrapping_Scripts/Annonce/MorningCroissant_Annonce',
  './Scrapping_Scripts/Annonce/ParuVendu_Annonce',
  './Scrapping_Scripts/Annonce/Rentola_Annonce',
];

async function runScript(script) {
  return new Promise((resolve, reject) => {
    const process = exec(`node ${script}`, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Erreur avec le script ${script}:`, stderr);
        reject(error);
      } else {
        console.log(`Script ${script} terminé avec succès.`);
        resolve(totalAnnonces);
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
