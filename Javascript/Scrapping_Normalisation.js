const { exec } = require('child_process');

const scripts = [
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Appartager_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_BienIci_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Coliving_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Flatlooker_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_ImmoJeune_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Koliving_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_MorningCroissant_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_ParuVendu_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Rentola_Annonce',
  './Scrapping_Scripts/Annonce/Normalisation/Normalisation_Roomster_Annonce',
];

async function runScript(script) {
  return new Promise((reject) => {
    const process = exec(`node ${script}`, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Erreur avec le script ${script}:`, stderr);
        reject(error);
      } else {
        console.log(`Script ${script} terminé avec succès.`);
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
