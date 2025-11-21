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
    
    async createSession(eventId, {startDate, endDate}, tx= prismaClient){
        return tx.eventSession.create({
            data: {
                eventId,
                startDate,
                endDate,
            },
        })
    },

    async handleBanner(banner) {
        if (!banner) return null;
        return await fileService.save(banner, eventService.DEFAULT_MEDIA_FOLDER);
    }
};

export default eventService;