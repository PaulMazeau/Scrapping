import requests
import json
from datetime import datetime


url = 'https://kg-backend-prod.herokuapp.com/graphql'

headers = {
    'Content-Type': 'application/json',
    # Ajoutez d'autres en-têtes si nécessaire, par exemple 'Authorization' pour l'authentification
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

# Ajouter cette date à la fin du nom du fichier lors de la sauvegarde
output_file_name = f'../../Resultat_Recherche/Koliving_Recherche/Data_Koliving_Recherche_{current_date_string}.json'

if response.status_code == 200:
    all_data = response.json() # Transforme la réponse en objet Python
    total_scraped = len(all_data.get('data', {}).get('res', {}).get('results', []))
    
    with open(output_file_name, 'w', encoding='utf-8') as file:
        json.dump(all_data, file, ensure_ascii=False, indent=4)
    
    print(f"Total d'annonces scrapées : {total_scraped}")
    print(f"Données sauvegardées dans {output_file_name}!")
else:
    print(f"Erreur {response.status_code}: {response.text}")