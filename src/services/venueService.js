import { prisma as prismaClient } from '../config/db.js';

const venueService = {
    async create(eventId, { name, address, city, country, zipCode, longitude, latitude, googlePlaceId }, tx = prismaClient) {
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
            },
        });
    },

    async getVenues() {
        return prismaClient.venue.findMany();
    },
};
export default venueService;