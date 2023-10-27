import requests
import json
from datetime import datetime

base_url = "https://coliving.com/locations/search-listings"
params = {
    "price_min": "",
    "price_max": "",
    "room_type": "",
    "bathroom": "",
    "location_id": "77",
    "zoom": "4",
    "center[lat]": "46.227638",
    "center[lng]": "2.213749"
}
all_data = []
page = 1
total_scraped = 0

while True:
    params["page"] = page
    response = requests.get(base_url, params=params)

    if response.status_code != 200:
        print(f"Erreur {response.status_code}: {response.text}")
        break

    # Ici, nous utilisons get pour extraire les annonces de la clé "listings"
    data = response.json().get("listings", [])
    
    if not data:  # Si la réponse est une liste vide, nous avons atteint la dernière page
        break

    # Imprimer le nombre d'annonces pour cette page
    print(f"Page {page} : {len(data)} annonces scrapées")

    all_data.extend(data)  # Ajouter les données de cette page à notre liste globale
    total_scraped += len(data)

    if len(data) < 25:  # Si moins de 25 annonces sont renvoyées, nous avons atteint la dernière page
        break

    page += 1

#Obtenir la date actuelle sous forme de chaîne
current_date_string = datetime.now().strftime('%Y-%m-%d')

#Ajouter cette date à la fin du nom du fichier lors de la sauvegarde
output_file_name = f'../../Resultat_Recherche/Coliving_Recherche/Data_Coliving_Recherche_{current_date_string}.json'

with open(output_file_name, 'w', encoding='utf-8') as file:
    json.dump(all_data, file, ensure_ascii=False, indent=4)

print(f"Total d'annonces scrapées : {total_scraped}")
print(f"Données sauvegardées dans {output_file_name}!")
