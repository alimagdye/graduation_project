import { prisma as prismaClient } from './../config/db.js';

const ticketTypeService = {
    //CREATE BULK TICKETS
    async createBulk(eventId, ticketTypes, tx = prismaClient) {
        const ticketTypeData = ticketTypes.map(ticket => ({
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
    async createFreeBulk(eventId, ticketTypes, tx= prismaClient){
        const ticketTypeData = ticketTypes.map(ticket => ({
            eventId,
            name: ticket.name || 'Free Ticket',
            price: 0,
            quantity: ticket.quantity,
        }));
        return tx.ticketType.createMany({
            data: ticketTypeData
        })
    },

    //GET TOTAL TICKETS FOR EVENT
    async getTotalTickets(eventId){
        const totalTickets = await prismaClient.ticketType.aggregate({
            where: {eventId},
            _sum: {quantity: true},
        });
        return totalTickets._sum.quantity || 0;
    },

    async getAllTicketTypes(eventId) {
        return prismaClient.ticketType.findMany({
            where: { eventId },
        });
    },
    
    
};


export default ticketTypeService;