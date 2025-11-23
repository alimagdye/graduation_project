import { prisma as prismaClient } from '../config/db.js';
import eventService from './eventService.js';
import ticketTypeService from './ticketTypeService.js';
import venueService from './venueService.js';
import fileService from './fileService.js';
import EventType from '../constants/enums/eventType.js';
import categoryService from '../services/categoryService.js';

const organizerService = {
    // CREATE
    async create(userId, { isApproved = false }, tx = prismaClient) {
        return tx.organizer.create({
            data: { 
                userId, 
                isApproved 
            }
        });
    },
    
    // CREATE EVENT
    async createEvent(userId, { title, categoryName, sessions, location, description, banner, tickets, type, mode }) {
        const [organizer, category] = await Promise.all([
            organizerService.getByUserId(userId),
            categoryService.getByCategory(categoryName)
        ]);
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

        if(!category) return {status:'fail', data: {error: 'Invalid category'}};
        
        let result = null;
        try {
            const result = await prismaClient.$transaction(async (tx) => {
                const venue = await venueService.create(location, tx);
                
                const event = await eventService.create(organizer.id, {
                    title,
                    description,
                    banner,
                    mode,
                    type,
                    venueId: venue.id, 
                    categoryId: category.id,
                }, tx);
                
                const eventSessions = await eventService.createBulkSessions(event.id, sessions, tx);

                let ticketTypes = [];
                if (tickets && tickets.length > 0 && type === EventType.TICKTED) {
                    ticketTypes = await ticketTypeService.createBulk(event.id, tickets, tx);
                } else if (tickets && tickets.length > 0 && type === EventType.FREE) {
                    ticketTypes = await ticketTypeService.createFreeBulk(event.id, tickets, tx);
                }

                return { event, ticketTypes, venue, eventSessions };
            });

            return {
                status: 'success',
                data: result,
            };
        } catch (err) {
            if (result?.event.bannerPath) {
                console.log(result?.event.bannerPath);
                await fileService.delete(result?.event.bannerPath);
            }
            console.log(err);
            throw err;
        }
    },
    
    //TODO
    // async listEvents(organizerId, { status, dateRange }) {
    //     return eventService.list({ status, dateRange, organizerId });
    // },
    
    // async updateEvent(userId, eventId, { title, description, startDate, endDate, status, banner }) {
        
    // },
    
    // async deleteEvent(organizerId, eventId) {
    //     const event = eventService.getById(eventId);
        
    //     if (event.organizerId !== organizerId) {
    //         return {
    //             status: 'fail',
    //             data: { error: 'Unauthorized to delete this event' },
    //         };
    //     }
        
    //     return eventService.delete(eventId);
    // },
    
    async getByUserId(userId) {
        return prismaClient.organizer.findUnique({
            where: { userId },
        });
    },
    
};

export default organizerService;