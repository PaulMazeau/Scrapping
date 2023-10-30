import requests
import json
from datetime import datetime, timedelta

def get_old_data(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

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

current_date_string = datetime.now().strftime('%Y-%m-%d')
output_file_name = f'../../Resultat_Recherche/Coliving_Recherche/Data_Coliving_Recherche_{current_date_string}.json'

# Lisez les anciennes données
previous_day_string = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
old_file_name = f'../../Resultat_Recherche/Coliving_Recherche/Data_Coliving_Recherche_{previous_day_string}.json'
old_data = get_old_data(old_file_name)

# Identifiez les nouvelles annonces et les annonces supprimées
new_announcements = [item for item in all_data if item['id'] not in [old_item['id'] for old_item in old_data]]
removed_announcements = [item for item in old_data if item['id'] not in [new_item['id'] for new_item in all_data]]

# Créez la liste des annonces à jour en excluant les annonces supprimées
updated_data = [item for item in all_data if item['id'] not in [removed_item['id'] for removed_item in removed_announcements]]

# Sauvegardez toutes les annonces scrappées du jour
with open(output_file_name, 'w', encoding='utf-8') as file:
    json.dump(all_data, file, ensure_ascii=False, indent=4)

# Sauvegardez les annonces mises à jour
updated_file_name = f'../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_Coliving_Recherche_{current_date_string}.json'
with open(updated_file_name, 'w', encoding='utf-8') as file:
    json.dump(updated_data, file, ensure_ascii=False, indent=4)

print(f"Total d'annonces scrapées : {total_scraped}")
print(f"Données du jour sauvegardées dans {output_file_name}!")
print(f"{len(new_announcements)} nouvelle(s) annonce(s).")
print(f"{len(removed_announcements)} annonce(s) supprimée(s).")
print(f"{len(updated_data) - len(new_announcements)} annonce(s) conservée(s).")
print(f"Données mises à jour sauvegardées dans {updated_file_name}!")