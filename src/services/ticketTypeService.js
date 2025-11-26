import { prisma as prismaClient } from './../config/db.js';

const ticketTypeService = {
    //CREATE BULK TICKETS
    async createBulkTickets(eventId, ticketTypes, tx = prismaClient) {
        const ticketTypeData = ticketTypes.map((ticket) => ({
            eventId,
            name: ticket.name,
            price: ticket.price,
            quantity: ticket.quantity,
        }));
        return tx.ticketType.createMany({
            data: ticketTypeData,
        });
    },

    //CREATE FREE BULK TICKET
    async createFreeBulkTickets(eventId, ticketTypes, tx = prismaClient) {
        const ticketTypeData = ticketTypes.map((ticket) => ({
            eventId,
            name: ticket.name || 'Free Ticket',
            price: 0,
            quantity: ticket.quantity || 100,
        }));
        return tx.ticketType.createMany({
            data: ticketTypeData,
        });
    },

    //GET TOTAL TICKETS FOR EVENT
    async getTotalTickets(eventId) {
        const totalTickets = await prismaClient.ticketType.aggregate({
            where: { eventId },
            _sum: { quantity: true },
        });
        return totalTickets._sum.quantity || 0;
    },

    async getAllTicketTypes(eventId) {
        return prismaClient.ticketType.findMany({
            where: { eventId },
        });
    },

    async deleteTickets(eventId, tx = prismaClient) {
        return tx.ticketType.deleteMany({
            where: { eventId },
        });
    },
};

export default ticketTypeService;
