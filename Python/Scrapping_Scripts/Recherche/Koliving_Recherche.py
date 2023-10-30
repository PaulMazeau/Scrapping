import requests
import json
from datetime import datetime, timedelta


def get_old_data(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file).get('data', {}).get('res', {}).get('results', [])
    except FileNotFoundError:
        return []

url = 'https://kg-backend-prod.herokuapp.com/graphql'

headers = {
    'Content-Type': 'application/json',
}

# Contenu de la requête GraphQL
data = {
    "operationName": "SearchProperties",
    "variables": {
        "searchQuery": {
            "city": "Paris",
            "bounds": [
                [48.90214747577797, 2.469850925555473],
                [48.90214747577797, 2.224219054341255],
                [48.81556220872687, 2.224219054341255],
                [48.81556220872687, 2.469850925555473],
                [48.90214747577797, 2.469850925555473]
            ],
            "page": 1,
            "pageSize": 4000,
            "latitude": 48.856614,
            "longitude": 2.3522219
        }
    },
    "query": """
        query SearchProperties($searchQuery: SearchPropertiesRequestDto!) {
            res: searchProperties(searchQuery: $searchQuery) {
                count
                results {
                    _id
                    propertyIdNumber
                    title
                    type
                    rentType
                    surface
                    nbRooms
                    nbBedrooms
                    isCrushed
                    isKolivingPlus
                    floor
                    nbFloors
                    eligibility {
                        isEligible
                        reason
                        __typename
                    }
                    rentInfos {
                        state
                        rentPrice
                        utilities
                        availableAt
                        minimumRentalDuration
                        isAvailable
                        discount {
                            rent {
                                amount {
                                    absolute
                                    perc
                                    __typename
                                }
                                durationMonth
                                __typename
                            }
                            proFees {
                                amount {
                                    absolute
                                    perc
                                    __typename
                                }
                                end
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                    description
                    createdAt
                    updatedAt
                    pictures {
                        _id
                        url
                        position
                        __typename
                    }
                    videos {
                        _id
                        url
                        __typename
                    }
                    rooms {
                        _id
                        roomIdNumber
                        rentInfos {
                            state
                            rentPrice
                            utilities
                            availableAt
                            isAvailable
                            minimumRentalDuration
                            discount {
                                rent {
                                    amount {
                                        absolute
                                        perc
                                        __typename
                                    }
                                    durationMonth
                                    __typename
                                }
                                proFees {
                                    amount {
                                        absolute
                                        perc
                                        __typename
                                    }
                                    end
                                    __typename
                                }
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                    addressObj {
                        street
                        city
                        zip
                        neighborhood
                        location {
                            coordinates
                            __typename
                        }
                        __typename
                    }
                    isDeactivated
                    lowestRoomPrice
                    __typename
                }
                __typename
            }
        }
    """
}

response = requests.post(url, headers=headers, data=json.dumps(data))

# Obtenir la date actuelle sous forme de chaîne
current_date_string = datetime.now().strftime('%Y-%m-%d')

if response.status_code == 200:
    all_data = response.json() # Transforme la réponse en objet Python
    results_today = all_data.get('data', {}).get('res', {}).get('results', [])

    # Chargement des anciennes données
    previous_day_string = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    old_file_name = f'../../Resultat_Recherche/Koliving_Recherche/Data_Koliving_Recherche_{previous_day_string}.json'
    old_data = get_old_data(old_file_name)

    # Identifier les nouvelles annonces et les annonces supprimées
    new_announcements = [item for item in results_today if item['_id'] not in [old_item['_id'] for old_item in old_data]]
    removed_announcements = [item for item in old_data if item['_id'] not in [new_item['_id'] for new_item in results_today]]

    # Créez la liste des annonces à jour en excluant les annonces supprimées
    updated_data = [item for item in results_today if item['_id'] not in [removed_item['_id'] for removed_item in removed_announcements]]

    # Sauvegardez toutes les annonces scrappées du jour
    output_file_name = f'../../Resultat_Recherche/Koliving_Recherche/Data_Koliving_Recherche_{current_date_string}.json'
    with open(output_file_name, 'w', encoding='utf-8') as file:
        json.dump({"data": {"res": {"results": results_today}}}, file, ensure_ascii=False, indent=4)

    # Sauvegardez les annonces mises à jour
    updated_file_name = f'../../Resultat_Recherche/Up_To_Date_Recherche/Updated_Data_Koliving_Recherche_{current_date_string}.json'
    with open(updated_file_name, 'w', encoding='utf-8') as file:
        json.dump({"data": {"res": {"results": updated_data}}}, file, ensure_ascii=False, indent=4)

    print(f"Total d'annonces scrapées : {len(results_today)}")
    print(f"Données du jour sauvegardées dans {output_file_name}!")
    print(f"{len(new_announcements)} nouvelle(s) annonce(s).")
    print(f"{len(removed_announcements)} annonce(s) supprimée(s).")
    print(f"{len(updated_data) - len(new_announcements)} annonce(s) conservée(s).")
    print(f"Données mises à jour sauvegardées dans {updated_file_name}!")
else:
    print(f"Erreur {response.status_code}: {response.text}")