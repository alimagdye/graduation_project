import { prisma as prismaClient } from './../config/db.js';

const ticketTypeService = {
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
    
    async getAllTicketTypes(eventId) {
        return prismaClient.ticketType.findMany({
            where: { eventId },
        });
    },
    
    
};


export default ticketTypeService;