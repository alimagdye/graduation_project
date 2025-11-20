import { prisma as prismaClient } from '../config/db.js';
import eventService from './eventService.js';
import ticketTypeService from './ticketTypeService.js';
import venueService from './venueService.js';
import fileService from './fileService.js';

const organizerService = {
    async create(userId, { isApproved = false }, tx = prismaClient) {
        return tx.organizer.create({
            data: { 
                userId, 
                isApproved 
            }
        });
    },
    
    async createEvent(userId, { title, category, startDate, endDate, location, description, banner, tickets }) {
        const organizer = await organizerService.getByUserId(userId);
        if (!organizer) {
            return {
                status: 'fail',
                data: { error: 'Organizer profile not found' },
            };
        }

        if (!organizer.isApproved) {
            return {
                status: 'fail',
                data: { error: 'Organizer is not approved to create events' },
            };
        }
        
        let result = {};
        try {
            const result = await prismaClient.$transaction(async (tx) => {

                const venue = await venueService.create(location, tx);

                const event = await eventService.create(organizer.id, {
                    title,
                    category,
                    description,
                    startDate,
                    endDate,
                    banner,
                    venueId: venue.id 
                }, tx);

                let ticketTypes = [];
                if (tickets && tickets.length > 0) {
                    ticketTypes = await ticketTypeService.createBulk(event.id, tickets, tx);
                }

                return { event, ticketTypes, venue };
            });

            return {
                status: 'success',
                data: result,
            };
        } catch (err) {
            if (result.event.bannerPath) {
                await fileService.delete(result.event.bannerPath);
            }
            throw err;
        }
    },
    
    async listEvents(organizerId, { status, dateRange }) {
        return eventService.list({ status, dateRange, organizerId });
    },
    
    async updateEvent(userId, eventId, { title, description, startDate, endDate, status, banner }) {
        
    },
    
    async deleteEvent(organizerId, eventId) {
        const event = eventService.getById(eventId);
        
        if (event.organizerId !== organizerId) {
            return {
                status: 'fail',
                data: { error: 'Unauthorized to delete this event' },
            };
        }
        
        return eventService.delete(eventId);
    },
    
    async getByUserId(userId) {
        return prismaClient.organizer.findUnique({
            where: { userId },
        });
    },
    
};


export default organizerService;