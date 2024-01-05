const { exec } = require('child_process');

const scripts = [
  './Scrapping_Scripts/Recherche/Appartager_Recherche',
  './Scrapping_Scripts/Recherche/Rentola_Recherche',
  './Scrapping_Scripts/Recherche/Flatlooker_Recherche',
  './Scrapping_Scripts/Recherche/BienIci_Recherche',
  './Scrapping_Scripts/Recherche/Coliving_Recherche',
  './Scrapping_Scripts/Recherche/ImmoJeune_Recherche',
  //'./Scrapping_Scripts/Recherche/Koliving_Recherche',
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
        const totalAnnoncesMatch = stdout.match(/TOTAL_NOUVELLES_ANNONCES:(\d+)/);
        const totalAnnonces = totalAnnoncesMatch ? parseInt(totalAnnoncesMatch[1], 10) : null;
        console.log(`Script ${script} terminé avec succès. Total nouvelles annonces: ${totalAnnonces}`);
        resolve(totalAnnonces);
      }
    });
  });
}

async function runScriptsSequentially(scripts) {
  for (const script of scripts) {
    console.log(`Exécution du script ${script}...`);
    try {
      await runScript(script);
      console.log(`Le script ${script} a réussi.`);
    } catch (error) {
      console.log(`Le script ${script} a échoué.`);
    }
  }
}

runScriptsSequentially(scripts);
