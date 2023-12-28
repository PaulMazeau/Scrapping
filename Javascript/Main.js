const { exec } = require('child_process');

const scripts = [
  './Scrapping_Recherche.js',
  './Scrapping_Sort.js',
  './Scrapping_Annonce.js',
  './Scrapping_Normalisation.js',
  './Scrapping_Merge.js',
];

function runScript(script) {
  return new Promise((resolve, reject) => {
    exec(`node ${script}`, (error, stdout, stderr) => {
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

async function executeScriptsSequentially() {
  for (const script of scripts) {
    try {
      await runScript(script);
    } catch (error) {
      console.error(`Une erreur s'est produite lors de l'exécution du script ${script}:`, error);
      break; // Arrêt après la première erreur
    }
  }
}

executeScriptsSequentially();
