import requests
import json
from datetime import datetime

base_url = 'https://www.roomster.com/api/search'
params = {
    "search_params.service_type": "haveshare",
    "search_params.sort": "LastActivity",
    "search_params.budget.min": 0,
    "search_params.budget.max": 5000,
    "search_params.age.min": 18,
    "search_params.age.max": 99,
    "search_params.geo.lat_sw": 48.68600550000002,
    "search_params.geo.lng_sw": 1.8559090000001388,
    "search_params.geo.lat_ne": 49.03160949999999,
    "search_params.geo.lng_ne": 2.838084999999942,
    "search_params.geo.radius_scale": 1,
    "search_params.geo.country_code": None,
    "search_params.include_total_count": True,
    "search_params.is_cache_loaded": True,
    "search_params.searchLocation": "Paris, France",
    "search_params.page_size": 10,
    "search_params.withoutPush": False,
    "search_params.geoIsNotFound": False
}

all_data = []
page = 1
total_scraped = 0  # Compteur pour les annonces scrapées

while True:
    params["search_params.page_number"] = page
    response = requests.get(base_url, params=params)

    if response.status_code != 200:
        print(f"Erreur {response.status_code}: {response.text}")
        break

    data = response.json()
    
    if not data:  # Si la réponse est vide ou non attendue
        break

    all_data.append(data)
    total_scraped += len(data)  # Ajouter le nombre d'annonces de cette page au compteur global

    # Vérifiez si nous sommes à la dernière page ici
    if len(data) < params["search_params.page_size"]:
        break

    page += 1

# Obtenir la date actuelle sous forme de chaîne
current_date_string = datetime.now().strftime('%Y-%m-%d')

# Ajouter cette date à la fin du nom du fichier lors de la sauvegarde
output_file_name = f'../../Resultat_Recherche/Roomster_Recherche/Data_Roomster_Recherche_{current_date_string}.json'

with open(output_file_name, 'w', encoding='utf-8') as file:
    json.dump(all_data, file, ensure_ascii=False, indent=4)

print(f"Total d'annonces scrapées : {total_scraped}")
print(f"Données sauvegardées dans {output_file_name}!")