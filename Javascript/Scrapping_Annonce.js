const { exec } = require('child_process');

const scripts = [
  './Scrapping_Scripts/Annonce/Appartager_Annonce',
  './Scrapping_Scripts/Annonce/Coliving_Annonce',
  './Scrapping_Scripts/Annonce/Flatlooker_Annonce',
  './Scrapping_Scripts/Annonce/ImmoJeune_Annonce',
  //'./Scrapping_Scripts/Annonce/Koliving_Annonce',
  './Scrapping_Scripts/Annonce/MorningCroissant_Annonce',
  './Scrapping_Scripts/Annonce/ParuVendu_Annonce',
  './Scrapping_Scripts/Annonce/Rentola_Annonce',
];

function runScript(script) {
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

async function runScriptsSequentially() {
  for (const script of scripts) {
    try {
      await runScript(script);
      console.log(`Le script ${script} a réussi.`);
    } catch (error) {
      console.log(`Le script ${script} a échoué :`, error);
    }
  }
}

runScriptsSequentially();
