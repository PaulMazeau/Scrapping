const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const url = 'https://kg-backend-prod.herokuapp.com/graphql';

const headers = {
    'Content-Type': 'application/json'
};

const data = {
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
    "query": `
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
    `
};


axios.post(url, data, { headers: headers })
    .then(async (response) => {
        const currentDateString = getCurrentDateString;
        const resultsToday = response.data.data.res.results || [];

        const previousDayString = getPreviousDateString; 

        const oldFileName = path.join(__dirname, '../../Resultat_Recherche/Koliving_Recherche', `Data_Koliving_Recherche_${previousDayString}.json`);        
        const oldData = await getOldData(oldFileName);

        const newAnnouncements = resultsToday.filter(item => !oldData.some(oldItem => oldItem._id === item._id));
        const removedAnnouncements = oldData.filter(item => !resultsToday.some(newItem => newItem._id === item._id));
        const updatedData = resultsToday.filter(item => !removedAnnouncements.some(removedItem => removedItem._id === item._id));

        const outputFileName = path.join(__dirname, '../../Resultat_Recherche/Koliving_Recherche', `Data_Koliving_Recherche_${currentDateString}.json`);
        const updatedFileName = path.join(__dirname, '../../Resultat_Recherche/Up_To_Date_Recherche/Koliving_Recherche_Up_To_Date', `Updated_Data_Koliving_Recherche_${currentDateString}.json`);

        await fs.writeFile(outputFileName, JSON.stringify({ data: { res: { results: resultsToday } } }, null, 4), 'utf-8');
        await fs.writeFile(updatedFileName, JSON.stringify({ data: { res: { results: updatedData } } }, null, 4), 'utf-8');

        console.log(`Total d'annonces scrapées : ${resultsToday.length}`);
        console.log(`Données du jour sauvegardées dans ${outputFileName}!`);
        console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Appartager.`);
        console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
        console.log(`${updatedData.length - newAnnouncements.length} annonce(s) conservée(s).`);
        console.log(`Données mises à jour sauvegardées dans ${updatedFileName}!`);
    })