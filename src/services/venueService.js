import { prisma as prismaClient } from '../config/db.js';

const venueService = {
    async create({ name, address, city, country, state, zipCode = null, longitude, latitude, googlePlaceId = null }, tx = prismaClient) {
        return tx.venue.create({
            data: {
                name,
                address,
                city,
                country,
                state,
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