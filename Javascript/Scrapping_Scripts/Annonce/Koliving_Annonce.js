const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getCurrentDateString, getPreviousDateString } = require('../dateUtils');
const { getOldData } = require('../dataUtils');

const currentDate = getCurrentDateString();
const previousDate = getPreviousDateString();

const rawDataPath = path.join(__dirname, `../../Resultat_Recherche/Up_To_Date_Recherche/Koliving_Recherche_Up_To_Date/Updated_Data_Koliving_Recherche_${currentDate}.json`);
const previousDataPath = path.join(__dirname, `../../Resultat_Annonce/Koliving_Annonce/Data_Koliving_Annonces_${previousDate}.json`);
const previousData = getOldData(previousDataPath)

fs.readFile(rawDataPath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    const jsonContent = JSON.parse(data);
    const annonces = jsonContent.data.res.results;
    const allResponses = [];

    const graphqlEndpoint = 'https://kg-backend-prod.herokuapp.com/graphql';

    for (const annonce of annonces) {
        const propertyIdNumber = annonce.propertyIdNumber;
      const graphqlQuery = {
        operationName: "GetProperty",
        query: `query GetProperty($propertyId: String!) {
          property: getProperty(propertyId: $propertyId) {
            _id
            propertyIdNumber
            diagnostic {
              energyConsumption
              gazConsumption
            }
            insurance {
              id
              amount
            }
            pictures {
              _id
              url
              position
            }
            videos {
              _id
              url
            }
            isDeactivated
            isPublished
            type
            landlord
            floor
            nbFloors
            nbBedrooms
            nbRooms
            nbUnavailableRooms
            hasUnavailableRooms
            announceValidationStatus
            surface
            surfaceTotal
            virtualVisitUrl
            title
            description
            addressObj {
              street
              city
              zip
              department
              region
              country
              neighborhood
              location {
                type
                coordinates
              }
            }
            amenities
            hasElevator
            isKolivingPlus
            isCrushed
            createdAt
            updatedAt
            includesCoOwnershipUtilities
            company {
              _id
              name
              description
              logoUrl
              rentType
              areVisitsEnabled
              kolivingTenantRentRate
            }
            rentType
            rentInfos {
              state
              price
              rentPrice
              utilities
              deposit
              availableAt
              isAvailable
              minimumRentalDuration
              discount {
                rent {
                  amount {
                    absolute
                    perc
                  }
                  durationMonth
                }
                proFees {
                  amount {
                    absolute
                    perc
                  }
                  end
                }
              }
            }
            tenant {
              socialStatus
              gender
              age
              firstname
              lastname
              phone
              bookingStartDate
            }
            pendingBooking {
              _id
              state
            }
            metadata {
              source
              checkoutUrl
            }
            rooms {
              _id
              roomIdNumber
              surface
              pendingBooking {
                _id
                state
              }
              rentInfos {
                price
                rentPrice
                utilities
                deposit
                availableAt
                isAvailable
                state
                minimumRentalDuration
                discount {
                  rent {
                    amount {
                      absolute
                      perc
                    }
                    durationMonth
                  }
                  proFees {
                    amount {
                      absolute
                      perc
                    }
                    end
                  }
                }
              }
              tenant {
                socialStatus
                gender
                age
                firstname
                lastname
                phone
                bookingStartDate
              }
              isDeactivated
              hasPrivateBathroom
              typeOfBed
              pictures {
                _id
                url
                position
              }
            }
          }
        }`,
        variables: { propertyId: String(propertyIdNumber) }
      };

      const options = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include other headers like 'Authorization' if required
        },
        data: graphqlQuery,
        url: graphqlEndpoint,
      };

      try {
        const response = await axios(options);
        const propertyData = response.data.data.property;

        // Supposons que l'URL de l'annonce est dans 'propertyData.metadata.checkoutUrl'
        const annonceUrl = propertyData.metadata.checkoutUrl;

        // Ajoutez l'URL à l'objet que vous enregistrez
        allResponses.push({ propertyIdNumber, data: propertyData, link: annonceUrl });
        console.log(`Data for ${propertyIdNumber} fetched`);
    } catch (error) {
        console.error('Error fetching data for', propertyIdNumber, ':', error);
    }

    await sleep(1000); // Votre pause existante
}

let newAnnouncements, removedAnnouncements, upToDateAnnouncements;
if (previousData.length === 0) {
    console.log('Aucune donnée précédente disponible. Traitement des annonces actuelles comme à jour.');
    upToDateAnnouncements = allResponses;
    newAnnouncements = [];
    removedAnnouncements = [];
} else {
    newAnnouncements = allResponses.filter(item => !previousData.some(oldItem => oldItem.propertyIdNumber === item.propertyIdNumber));
    removedAnnouncements = previousData.filter(item => !allResponses.some(newItem => newItem.propertyIdNumber === item.propertyIdNumber));
    upToDateAnnouncements = allResponses.filter(item => !newAnnouncements.includes(item));
}

const fileName = path.join(__dirname, `../../Resultat_Annonce/Koliving_Annonce/Data_Koliving_Annonces_${currentDate}.json`);
const upToDateDataPath = path.join(__dirname, `../../Resultat_Annonce/Up_To_Date_Annonce/Koliving_Annonce_Up_To_Date/Updated_Data_Koliving_Annonces_${currentDate}.json`);

fs.writeFileSync(fileName, JSON.stringify(allResponses, null, 2), 'utf-8');
fs.writeFileSync(upToDateDataPath, JSON.stringify(upToDateAnnouncements, null, 2), 'utf-8');

console.log(`All data saved to ${fileName}!`);
console.log(`TOTAL_NOUVELLES_ANNONCES:${newAnnouncements.length} nouvelles annonces sur Koliving.`);
console.log(`${removedAnnouncements.length} annonce(s) supprimée(s).`);
console.log(`${upToDateAnnouncements.length} annonce(s) à jour.`);
});

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}