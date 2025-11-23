import { prisma as prismaClient } from '../config/db.js';
import slugify from 'slugify';
import ConflictError from '../errors/ConflictError.js';
import { PrismaQueryBuilder } from '../utils/queryBulider.js';
import eventStatus from '../constants/enums/eventStatus.js';
import fileService from './fileService.js';

const eventService = {
    DEFAULT_MEDIA_FOLDER: 'events',
    
    DEFAULT_EXCLUDE_FIELDS: {
        updatedAt: true,
    },
    
    DEFAULT_SELECTIONS: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        eventType: true,
        eventMode: true,
        bannerDisk: true,
        bannerPath: true,
        venueId: true,
        categoryId: true,
        createdAt: true,
    },
    
    DEFAULT_RELATIONS: {
        venue: true,
    },

    async create(organizerId, { title, description, status = eventStatus.ACTIVE, type, mode, banner, venueId, categoryId }, tx = prismaClient, { exclude = eventService.DEFAULT_EXCLUDE_FIELDS } = {}) {
        const slug = slugify(title, { lower: true, strict: true });

        const existingEvent = await eventService.findBySlug(slug);
        if (existingEvent) {
            throw new ConflictError('Event with the same title already exists');
        }

        const { disk: bannerDisk, url: bannerPath, absUrl } = await eventService.handleBanner(banner, slug);

        const event = await tx.event.create({
            data: {
                organizerId,
                title,
                slug,
                description,
                bannerDisk,
                bannerPath,
                status,
                eventMode: mode,
                eventType: type,
                venueId,
                categoryId
            },
            omit: exclude,
        });

        const { bannerDisk: _, bannerPath: __, ...eventData } = event;

        return {
            ...eventData,
            bannerUrl: absUrl
        };
    },

    async createBulkSessions(eventId, sessions, tx= prismaClient) {
        const sessionsData = sessions.map(session => ({
            eventId,
            startDate: session.startDate,
            endDate: session.endDate,
        }));

        return tx.eventSession.createManyAndReturn({
            data: sessionsData,
        });
    },

    async handleBanner(banner, relPath = null) {
        if (!banner) return { disk: null, url: null, absUrl: null };

        const folder = relPath ? `${eventService.DEFAULT_MEDIA_FOLDER}/${relPath}` : eventService.DEFAULT_MEDIA_FOLDER;
        return await fileService.save(banner, folder);
    },

    async findBySlug(slug, { exclude = eventService.DEFAULT_EXCLUDE_FIELDS } = {}) {
        return prismaClient.event.findUnique({
            where: { slug: slug },
            omit: exclude,
        });
    },

    async getAll({ selections, relations, page = 1, limit = 10, orderBy, exclude = eventService.DEFAULT_EXCLUDE_FIELDS } = {}) {
        const queryOptions = new PrismaQueryBuilder()
            .paginate(page, limit)
            .sort(orderBy || { createdAt: 'desc' })
            .select(selections || eventService.DEFAULT_SELECTIONS)
            .include(relations || eventService.DEFAULT_RELATIONS)
            .omit(exclude)
            .value;

        return prismaClient.event.findMany({
            where: {},
            ...queryOptions
        });
    },

    async getById(id, { selections = eventService.DEFAULT_SELECTIONS, relations = eventService.DEFAULT_RELATIONS }) {
        const queryOptions = new PrismaQueryBuilder()
            .select(selections)
            .include(relations)
            .omit(eventService.DEFAULT_EXCLUDE_FIELDS)
            .value;
        
        const event = prismaClient.event.findUnique({
            where: { id },
            ...queryOptions
        });
        
        if (event) {
            const [eventWithBannerUrl] = eventService.getBannerAbsUrl(event);
            return eventWithBannerUrl;
        }
        return null;
    },

    async getLatest({ selections, relations, orderBy = 'desc', exclude = eventService.DEFAULT_EXCLUDE_FIELDS }, { limit = 5, page = 1 }) {
        const query = new PrismaQueryBuilder()
            .paginate(page, limit)
            .sort({ createdAt: orderBy })
            .select(selections)
            .include(relations)
            .omit(exclude)
            .value;

        const events = await prismaClient.event.findMany({
            where: {},
            ...query
        });

        return eventService.getBannerAbsUrl(events);
    },
    
    getBannerAbsUrl(events) {
        if (!events) return null;
        if (events && !Array.isArray(events)) {
            events = [events];
        }
        return events.map(event => {
            const { bannerDisk, bannerPath } = event;

            const absUrl = bannerPath ? fileService.getAbsUrl(bannerPath, bannerDisk) : null;

            const { bannerDisk: _, bannerPath: __, updatedAt: ___, ...eventData } = event;

            return {
                ...eventData,
                bannerUrl: absUrl
            };
        });
    },
};

export default eventService;