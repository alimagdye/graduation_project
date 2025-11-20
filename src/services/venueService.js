import { prisma as prismaClient } from '../config/db.js';

const venueService = {
    async create(eventId, { name, address, capacity, city, country, zipCode, longitude, latitude }, tx = prismaClient) {
        return tx.venue.create({
            data: {
                eventId,
                name,
                address,
                capacity,
                city,
                country,
                zipCode,
                longitude,
                latitude,
            },
        });
    },


    async getVenues() {
        return prismaClient.venue.findMany();
    },
};
export default venueService;