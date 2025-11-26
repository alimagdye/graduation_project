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
                isApproved,
            },
        });
    },

    // CREATE EVENT
    async createEvent(
        userId,
        {
            title,
            category: categoryName,
            startDate,
            endDate,
            location,
            description,
            banner,
            tickets,
            sessions,
            eventType,
            eventMode,
        }
    ) {
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
                if (!category) return { status: 'fail', data: { error: 'Invalid category' } };

                const event = await eventService.create(
                    organizer.id,
                    {
                        title,
                        description,
                        banner,
                        eventMode,
                        eventType,
                        venueId: venue.id,
                        categoryId: category.id,
                    },
                    tx
                );

                let eventSessions = [];
                if (eventMode === EventMode.SINGLE) {
                    const singleSession = await eventService.createSession(
                        event.id,
                        { startDate, endDate },
                        tx
                    );
                    eventSessions.push(singleSession);
                } else if (eventMode === EventMode.RECURRING) {
                    for (const s of sessions) {
                        const recurringSession = await eventService.createSession(
                            event.id,
                            { startDate: s.startDate, endDate: s.endDate },
                            tx
                        );
                        eventSessions.push(recurringSession);
                    }
                }

                let ticketTypes = [];
                if (tickets && tickets.length > 0 && eventType === EventType.TICKTED) {
                    ticketTypes = await ticketTypeService.createBulk(event.id, tickets, tx);
                } else if (tickets && tickets.length > 0 && eventType === EventType.FREE) {
                    // frontend -> [name: free ticket , quantity, price=0] // or will make it in backend
                    ticketTypes = await ticketTypeService.createFreeBulk(event.id, tickets, tx);
                }

                return { event, ticketTypes, venue, eventSessions };
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

    //UPDATE EVENT
    async updateEvent(
        userId,
        eventId,
        { title, categoryName, description, banner, tickets, sessions, type, mode, location }
    ) {
        const [organizer, event, category] = await Promise.all([
            organizerService.getByUserId(userId),
            eventService.getById(eventId),
            categoryService.getByCategory(categoryName),
        ]);

        if (!organizer) {
            return { status: 'fail', data: { error: 'Organizer not found' } };
        }

        if (!event) {
            return { status: 'fail', data: { error: `Event doesn't exist` } };
        }

        if (event.organizerId !== organizer.id) {
            return { status: 'fail', data: { error: 'Unauthorized to update this event' } };
        }

        if (!category) return { status: 'fail', data: { error: 'Invalid category' } };

        let oldBannerPath = event.bannerPath;
        let result;
        try {
            result = await prismaClient.$transaction(async (tx) => {
                let updatedVenueId = event.venueId;
                if (location) {
                    const updatedVenue = await venueService.update(event.venueId, location, tx);
                    updatedVenueId = updatedVenue.id;
                }

                const updatedEvent = await eventService.update(
                    eventId,
                    organizer.id,
                    {
                        title,
                        description,
                        banner,
                        mode,
                        type,
                        categoryId: category.id,
                        venueId: updatedVenueId,
                    },
                    tx
                );

                if (sessions && sessions.length > 0) {
                    await eventService.deleteSessions(eventId, tx);
                    await eventService.createBulkSessions(updatedEvent.id, sessions, tx);
                }

                if (tickets && tickets.length > 0) {
                    await ticketTypeService.deleteTickets(eventId, tx);

                    if (type === EventType.TICKETED) {
                        await ticketTypeService.createBulkTickets(eventId, tickets, tx);
                    } else if (type === EventType.FREE) {
                        await ticketTypeService.createFreeBulkTickets(eventId, tickets, tx);
                    }
                }

                return { updatedEvent };
            });

            if (banner && oldBannerPath) {
                await fileService
                    .delete(oldBannerPath)
                    .catch((e) => console.log('Old banner delete failed', e));
            }

            return {
                status: 'success',
                data: {
                    message: 'Event updated successfully',
                    event: result.updatedEvent,
                },
            };
        } catch (err) {
            if (result?.updatedEvent?.bannerPath) {
                await fileService
                    .delete(result.updatedEvent.bannerPath)
                    .catch((e) => console.log('Rollback banner delete failed', e));
            }
            throw err;
        }
    },

    //DELETE EVENT
    async deleteEvent(userId, eventId) {
        const [event, organizer] = await Promise.all([
            eventService.getById(eventId),
            organizerService.getByUserId(userId),
        ]);

        if (!event) {
            return {
                status: 'fail',
                data: { error: `Event doesn't exist` },
            };
        }

        if (!organizer) {
            return {
                status: 'fail',
                data: { error: 'Organizer profile not found' },
            };
        }

        if (!organizer.isApproved) {
            return {
                status: 'fail',
                data: { error: 'Organizer is not approved to delete events' },
            };
        }

        if (event.organizerId !== organizer.id) {
            return {
                status: 'fail',
                data: { error: 'Unauthorized to delete this event' },
            };
        }

        if (event.deletedAt) {
            return {
                status: 'fail',
                data: { error: 'Event already deleted' },
            };
        }

        // check if the event related to tickets -> can't delete else -> soft delete or hard delete

        let result;
        try {
            // result = await eventService.delete(eventId);
            result = await eventService.softDelete(eventId);
        } catch (err) {
            if (err.code === 'P2003') {
                return {
                    status: 'fail',
                    data: { error: `The event related to tickets can't be deleted` },
                };
            }
            throw err;
        }

        if (result?.bannerPath) {
            await fileService
                .delete(result.bannerPath)
                .catch((e) => console.log('Rollback banner delete failed', e));
        }

        return {
            status: 'success',
            data: {
                message: 'Event deleted successfully',
            },
        };
    },

    async getByUserId(userId) {
        return prismaClient.organizer.findUnique({
            where: { userId },
        });
    },
};

export default organizerService;
