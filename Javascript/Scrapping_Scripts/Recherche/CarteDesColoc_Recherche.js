const axios = require('axios');
const fs = require('fs');

// URL de la requête
const url = 'https://www.lacartedescolocs.fr/listing_search/list_results?viewport=%7B%22canonical_path%22%3A%22%2Ffr%2File-de-france%2Fparis%22%2C%22city%22%3A%22Paris%22%2C%22county%22%3A%22Paris%22%2C%22administrative%22%3A%22%C3%8Ele-de-France%22%2C%22country_code%22%3A%22fr%22%2C%22sw_lat%22%3A48.815575%2C%22sw_lon%22%3A2.224122%2C%22ne_lat%22%3A48.902156%2C%22ne_lon%22%3A2.469703%7D&filters=%7B%22offset%22%3A0%2C%22sortBy%22%3A%22published_at%20DESC%22%2C%22currency%22%3A%22EUR%22%7D';

axios.get(url)
  .then(response => {
    // Stocker la réponse dans un fichier JSON
    fs.writeFile('response.json', JSON.stringify(response.data, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Les données ont été enregistrées dans response.json');
    });
  })
  .catch(error => {
    console.error('Erreur lors de la requête :', error);
  });
