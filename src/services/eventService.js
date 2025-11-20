import { prisma as prismaClient } from '../config/db.js';
import eventStatus from '../constants/enums/eventStatus.js';
import fileService from './fileService.js';

const eventService = {
    DEFAULT_MEDIA_FOLDER: 'events',
    
    async create(organizerId, { title, category, description, startDate, endDate, status = eventStatus.ACTIVE, banner }, tx = prismaClient) {
        const { disk: bannerDisk, url: bannerPath } = await eventService.handleBanner(banner);
        
        return tx.event.create({
            data: {
                organizerId,
                title,
                description,
                bannerDisk,
                bannerPath,
                startDate,
                endDate,
                status,
            },
        });
    },
    
    async handleBanner(banner) {
        if (!banner) return null;

        return await fileService.save(banner, eventService.DEFAULT_MEDIA_FOLDER);
    }
};


export default eventService;