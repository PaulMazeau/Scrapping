import requests
import json
from datetime import datetime, timedelta

def get_old_data(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return []
    
BASE_URL = 'https://www.bienici.com/realEstateAds.json'
PARAMS = {
    'filters': json.dumps({
        "size": 24,
        "from": 0,
        "showAllModels": False,
        "filterType": "rent",
        "propertyType": ["house", "flat", "loft", "castle", "townhouse"],
        "page": 1,
        "sortBy": "relevance",
        "sortOrder": "desc",
        "onTheMarket": [True],
        "zoneIdsByTypes": {"zoneIds": ["-7444"]}
    }),
    'extensionType': 'extendedIfNoResult',
    'access_token': 'XFCgRiIm/5gxwcxQg0TU81XoA5F0IuwnwxhoHtf5VDI=:653a380e4d571100b2ac40e6',
    'id': '653a380e4d571100b2ac40e6'
}

all_data = []
page_number = 1 

while True:
    print(f"Fetching page {page_number}...")  # Print the current page number
    
    response = requests.get(BASE_URL, params=PARAMS)
    if response.status_code == 200:
        data = response.json()
        
        # Check if the returned data is less than the expected size.
        if not data['realEstateAds'] or len(data['realEstateAds']) < 24:
            all_data.extend(data['realEstateAds'])  # add remaining ads
            break
            
        all_data.extend(data['realEstateAds'])
        PARAMS['filters'] = json.dumps({**json.loads(PARAMS['filters']), "from": len(all_data), "page": int(len(all_data)/24) + 1})
        page_number += 1  # Increment the page number for next iteration
    else:
        print(f"Erreur {response.status_code}: {response.text}")
        break


#Obtenir la date actuelle sous forme de chaîne
current_date_string = datetime.now().strftime('%Y-%m-%d')

# Chargement des anciennes données
previous_day_string = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
old_file_name = f'../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_{previous_day_string}.json'
old_data = get_old_data(old_file_name)

# Identifier les nouvelles annonces et les annonces supprimées
new_announcements = [item for item in all_data if item['id'] not in [old_item['id'] for old_item in old_data]]
removed_announcements = [item for item in old_data if item['id'] not in [new_item['id'] for new_item in all_data]]

# Créez la liste des annonces à jour en excluant les annonces supprimées
updated_data = [item for item in all_data if item['id'] not in [removed_item['id'] for removed_item in removed_announcements]]

# Sauvegardez toutes les annonces scrappées du jour
output_file_name = f'../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_{current_date_string}.json'
with open(output_file_name, 'w', encoding='utf-8') as file:
    json.dump(all_data, file, ensure_ascii=False, indent=4)

# Sauvegardez les annonces mises à jour
updated_file_name = f'../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_Bienici_Recherche_{current_date_string}.json'
with open(updated_file_name, 'w', encoding='utf-8') as file:
    json.dump(updated_data, file, ensure_ascii=False, indent=4)

print(f"Total d'annonces scrappées: {len(all_data)}")
print(f"Données du jour sauvegardées dans {output_file_name}!")
print(f"{len(new_announcements)} nouvelle(s) annonce(s).")
print(f"{len(removed_announcements)} annonce(s) supprimée(s).")
print(f"{len(updated_data) - len(new_announcements)} annonce(s) conservée(s).")
print(f"Données mises à jour sauvegardées dans {updated_file_name}!")