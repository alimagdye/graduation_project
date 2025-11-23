import { prisma as prismaClient } from '../config/db.js';
import eventStatus from '../constants/enums/eventStatus.js';
import fileService from './fileService.js';
import slugify from 'slugify';

const eventService = {
    DEFAULT_MEDIA_FOLDER: 'events',
    
    // CREATE 
    async create(organizerId, { title, description, status = eventStatus.ACTIVE, eventMode, eventType, banner, venueId, categoryId }, tx = prismaClient) {
        const { disk: bannerDisk, url: bannerPath } = await eventService.handleBanner(banner);
        const slug = slugify(title, {lower: true, strict: true});
        
        return tx.event.create({
            data: {
                organizerId,
                title,
                slug,
                description,
                bannerDisk,
                bannerPath,
                status,
                eventMode,
                eventType,
                venueId,
                categoryId
            },
        });
    },
    
    //DELETE
    async deleteEvent(eventId) {
        return prismaClient.event.delete({
            where: {id: Number(eventId)},
        });
    },

    //UPDATE
    async updateEvent(eventId, {title, description, bannerPath, eventMode, eventType, categoryId, venueId}, tx= prismaClient){
        const slug = slugify(title, {lower:true, strict:true});

        return tx.event.update({
            where:{id: eventId},
            data: {
                title,
                slug,
                description,
                bannerPath,
                eventMode,
                eventType,
                categoryId,
                venueId,
            },
        });   
    },

    async createSession(eventId, {startDate, endDate}, tx= prismaClient){
        return tx.eventSession.create({
            data: {
                eventId,
                startDate,
                endDate,
            },
        });
    },

    async deleteSessions(eventId, tx= prismaClient){
        return tx.eventSession.deleteMany({
            where: {eventId},
        });
    },

    async handleBanner(banner) {
        if (!banner) return null;
        return await fileService.save(banner, eventService.DEFAULT_MEDIA_FOLDER);
    },

    async getById(eventId) {
        return prismaClient.event.findFirst({
            where:{id: Number(eventId)},
        });
    },
};

export default eventService;