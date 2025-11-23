import { prisma as prismaClient } from '../config/db.js';

const venueService = {
    async create(eventId, { name, address, city, country, zipCode, longitude, latitude, googlePlaceId, /*state*/ }, tx = prismaClient) {
        return tx.venue.create({
            data: {
                eventId,
                name,
                address,
                city,
                country,
                zipCode,
                longitude,
                latitude,
                googlePlaceId,
                //state
            },
        });
    },

    async update(venueId, {name , address, city, country, zipCode, longitude, latitude, googlePlaceId, /*state*/}, tx= prismaClient){
        return tx.venue.update({
            where:{id: venueId},
            data: {
                name,
                address,
                city,
                country,
                zipCode,
                latitude,
                longitude,
                googlePlaceId,
                //state
            },
        });
    },

    async getVenues() {
        return prismaClient.venue.findMany();
    },
};
export default venueService;