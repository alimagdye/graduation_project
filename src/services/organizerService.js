import { prisma as prismaClient } from '../config/db.js';
import eventService from './eventService.js';
import ticketTypeService from './ticketTypeService.js';
import venueService from './venueService.js';
import fileService from './fileService.js';
import EventMode from '../constants/enums/eventMode.js';
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
    async createEvent(userId, { title, category: categoryName, startDate, endDate, location, description, banner, tickets, sessions, eventType, eventMode }) {
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
        
        let result = null;
        try {
            const result = await prismaClient.$transaction(async (tx) => {

                const venue = await venueService.create(location, tx);
                
                const category = await categoryService.getByCategory(categoryName, tx); 
                if(!category) return {status:'fail', data: {error: 'Invalid category'}};

                const event = await eventService.create(organizer.id, {
                    title,
                    description,
                    banner,
                    eventMode,
                    eventType,
                    venueId: venue.id, 
                    categoryId: category.id,
                }, tx);
                
                let eventSessions = [];
                if(eventMode === EventMode.SINGLE){
                    const singleSession = await eventService.createSession(
                        event.id, {startDate, endDate}, tx
                    );
                    eventSessions.push(singleSession);
                }else if (eventMode === EventMode.RECURRING){
                    for(const s of sessions){
                        const recurringSession = await eventService.createSession(
                            event.id, {startDate: s.startDate, endDate: s.endDate}, tx
                        );
                        eventSessions.push(recurringSession);
                    };
                }

                let ticketTypes = [];
                if (tickets && tickets.length > 0 && eventType === EventType.TICKTED) {
                    ticketTypes = await ticketTypeService.createBulk(event.id, tickets, tx);
                }else if(tickets && tickets.length > 0 && eventType === EventType.FREE){
                    // frontend -> [name: free ticket , quantity, price=0] // or will make it in backend
                    ticketTypes = await ticketTypeService.createFreeBulk(event.id, tickets, tx);
                }

                return { event, ticketTypes, venue, eventSessions};
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