const axios = require('axios');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const filePath = `../../Resultat_Recherche/Up_To_Date_Recherche/Koliving_Recherche_Up_To_Date/Updated_Data_Koliving_Recherche_${getCurrentDateString()}.json`;
const graphqlEndpoint = 'https://kg-backend-prod.herokuapp.com/graphql';
const allResponses = [];

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const jsonContent = JSON.parse(data);
  const annonces = jsonContent.data.res.results;

  const fetchData = async () => {
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
        allResponses.push({ propertyIdNumber, data: response.data.data.property });
        console.log(`Data for ${propertyIdNumber} fetched`);
      } catch (error) {
        console.error('Error fetching data for', propertyIdNumber, ':', error);
      }

      // Avoid overloading the server with a delay between requests
      await sleep(1000);
    }

    const fileName = `../../Resultat_Annonce/Appartager_Annonce/Data_Appartager_Annonces_${getCurrentDateString()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(allResponses, null, 2), 'utf-8'); // Écrire toutes les données dans un seul fichier
    console.log(`All data saved to ${fileName}!`);
  };

  fetchData();
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
