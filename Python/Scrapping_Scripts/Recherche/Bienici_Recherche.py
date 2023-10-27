import requests
import json
from datetime import datetime

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

#Ajouter cette date à la fin du nom du fichier lors de la sauvegarde
output_file_name = f'../../Resultat_Recherche/Bienici_Recherche/Data_Bienici_Recherche_{current_date_string}.json'

with open(output_file_name, 'w', encoding='utf-8') as file:
    json.dump(all_data, file, ensure_ascii=False, indent=4)

print(f"Données sauvegardées dans {output_file_name}!")
print(f"Total d'annonces scrappées: {len(all_data)}")