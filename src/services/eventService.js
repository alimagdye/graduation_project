import { prisma as prismaClient } from '../config/db.js';
import sessionStatus from '../constants/enums/sessionStatus.js';
import fileService from './fileService.js';
import slugify from 'slugify';

const eventService = {
    DEFAULT_MEDIA_FOLDER: 'events',

    // CREATE
    async create(
        organizerId,
        {
            title,
            description,
            status = eventStatus.ACTIVE,
            eventMode,
            eventType,
            banner,
            venueId,
            categoryId,
        },
        tx = prismaClient
    ) {
        const { disk: bannerDisk, url: bannerPath } = await eventService.handleBanner(banner);
        const slug = slugify(title, { lower: true, strict: true });

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
                categoryId,
            },
        });
    },

    //DELETE
    async delete(eventId) {
        return prismaClient.event.delete({
            where: { id: Number(eventId) },
        });
    },

    //SOFT DELETE
    async softDelete(eventId) {
        return prismaClient.event.update({
            where: { id: Number(eventId) },
            data: { deletedAt: new Date() },
        });
    },

    //UPDATE
    async update(
        eventId,
        organizerId,
        { title, description, banner, mode, type, categoryId, venueId },
        tx = prismaClient
    ) {
        const slug = eventService.generateSlug(organizerId, title);

        const existingEvent = await eventService.findBySlug(slug);
        if (existingEvent) {
            throw new ConflictError('Event with the same title already exists');
        }

        let newBannerPath = null;
        let newBannerDisk = null;
        let newAbsUrl = null;
        if (banner) {
            const {
                disk: bannerDisk,
                url: bannerPath,
                absUrl,
            } = await eventService.handleBanner(banner);
            newBannerPath = bannerPath;
            newBannerDisk = bannerDisk;
            newAbsUrl = absUrl;
        }

        const updatedEvent = await tx.event.update({
            where: { id: eventId },
            data: {
                title,
                slug,
                description,
                mode,
                type,
                categoryId,
                venueId,
                ...(newBannerDisk && { bannerDisk: newBannerDisk }),
                ...(newBannerPath && { bannerPath: newBannerPath }),
            },
        });

        const { bannerDisk, bannerPath, ...updatedEventData } = updatedEvent;

        return {
            ...updatedEventData,
            bannerUrl: newAbsUrl || eventService.getBannerAbsUrl(updatedEvent)[0].bannerUrl,
        };
    },

    async deleteSessions(eventId, tx = prismaClient) {
        return tx.eventSession.deleteMany({
            where: { eventId },
        });
    },

    async handleBanner(banner) {
        if (!banner) return null;
        return await fileService.save(banner, eventService.DEFAULT_MEDIA_FOLDER);
    },

    async getById(eventId) {
        return prismaClient.event.findFirst({
            where: { id: Number(eventId) },
        });
    },
};

export default eventService;
