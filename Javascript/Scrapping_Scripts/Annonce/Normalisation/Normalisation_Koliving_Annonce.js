const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const rawDataPath = `../../../Resultat_Annonce/Koliving_Annonce/Data_Koliving_Annonces_${getCurrentDateString()}.json`;
let rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

function normalizeData(data) {
    // Conversion des URLs d'images
    const images = data.data.pictures ? data.data.pictures.map(pic => pic.url ) : [];
    // Normalisation des détails des chambres
    const roomsDetails = data.data.rooms ? data.data.rooms.map(room => {
        // Vérifiez si 'rentInfos' existe et n'est pas null
        const rentInfos = room.rentInfos ? room.rentInfos : {};

        return {
            title: `Chambre ${room.roomIdNumber}`,
            details: [
                `Surface: ${room.surface || ''} m²`,
                `Salle de bain privée: ${room.hasPrivateBathroom ? 'Oui' : 'Non'}`,
                // autres détails...
            ],
            amenities: room.amenities || [],
            rentInfos: {
                price: rentInfos.price || '0',
                rentPrice: rentInfos.rentPrice || '0',
                utilities: rentInfos.utilities || '0',
                deposit: rentInfos.deposit || '0',
                availableAt: rentInfos.availableAt || '',
                isAvailable: rentInfos.isAvailable || false,
                state: rentInfos.state || '',
                minimumRentalDuration: rentInfos.minimumRentalDuration || '',
                discount: rentInfos.discount || null
            },
            images: room.pictures ? room.pictures.map(pic => pic.url) : []
        };
    }) : [];

        // Trouver le prix de la première chambre disponible
        let firstAvailableRoomPrice = '0'; // Valeur par défaut
        for (const room of data.data.rooms || []) {
            if (room.rentInfos && room.rentInfos.isAvailable) {
                firstAvailableRoomPrice = room.rentInfos.rentPrice || '0';
                break; // Arrêtez de chercher dès que vous trouvez une chambre disponible
            }
        }

    return {
        title: data.data.title || '',
        location: {
            address: data.data.addressObj ? data.data.addressObj.street : '',
            city: data.data.addressObj ? data.data.addressObj.city : '',
            postalCode: data.data.addressObj ? data.data.addressObj.zip : ''
        },
        images: images,
        price: {
            rent: firstAvailableRoomPrice,
            charge: data.data.rentInfos ? data.data.rentInfos.utilities : '0',
            deposit: data.data.rentInfos ? data.data.rentInfos.deposit : '0',
        },
        furnished: 'Oui', // Ou 'Non' selon les données
        type: data.data.type || '',
        bedrooms: data.data.nbBedrooms ? data.data.nbBedrooms.toString() : '0',
        size: data.data.surface ? data.data.surface.toString() : '0',
        description: data.data.description || '',
        amenities: data.data.amenities || [],
        pieces: data.data.nbRooms ? data.data.nbRooms.toString() : '0',
        virtualTour: data.data.virtualVisitUrl || '',
        verified: data.data.isPublished ? 'Oui' : 'Non',
        link: '',
        bedroomsDetails: roomsDetails,
    };
}

let normalizedDataArray = rawData.map(annonce => normalizeData(annonce));
const normalizedDataPath = `../../../Resultat_Annonce/Normalisation/Normalized_Data_Koliving/Normalized_Data_Koliving_Annonces_${getCurrentDateString()}.json`;
fs.writeFileSync(normalizedDataPath, JSON.stringify(normalizedDataArray, null, 2), 'utf8');
