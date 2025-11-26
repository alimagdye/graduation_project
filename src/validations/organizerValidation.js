import { body } from 'express-validator';
import eventStatus from '../constants/enums/eventStatus.js';
import EventMode from '../constants/enums/eventMode.js';
import EventType from '../constants/enums/eventType.js';
import fileService from '../services/fileService.js';

const organizerValidation = {
    createEvent: [
        body('title')
            .trim()
            .isString()
            .withMessage('Title must be a string')
            .notEmpty()
            .withMessage('Title is required'),

        body('categoryName')
            .notEmpty()
            .withMessage('Category name is required')
            .isString()
            .withMessage('Category name must be a string')
            .trim(),

        body('description')
            .trim()
            .isString()
            .withMessage('Description must be a string')
            .notEmpty()
            .withMessage('Description is required'),

        body('status')
            .optional()
            .trim()
            .toLowerCase()
            .isIn(Object.values(eventStatus))
            .withMessage(`Status must be one of ${Object.values(eventStatus).join(', ')}`),

        body('banner').custom(async (value, { req }) => {
            if (!req.file) {
                throw new Error('Banner image is required');
            }

            const allowedTypes = ['image/jpg', 'image/png', 'image/gif'];
            const allowedExt = allowedTypes.map((type) => type.split('/')[1]).join(', ');
            if (!allowedTypes.includes(req.file.mimetype)) {
                await fileService.delete(req.file.path);
                throw new Error(`Only ${allowedExt} formats allowed`);
            }

            if (req.file.size > 5 * 1024 * 1024) {
                await fileService.delete(req.file.path);
                throw new Error('Image too large (Max 5MB)');
            }

            return true;
        }),

        body('location').isObject().withMessage('Location data is required'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid longitude'),
        body('location.name').trim().isString().notEmpty().withMessage('Venue name is required'),
        body('location.address').trim().isString().notEmpty().withMessage('Address is required'),
        body('location.country').trim().isString().notEmpty().withMessage('Country is required'),
        body('location.state').trim().isString(),
        body('location.city').trim().isString().notEmpty().withMessage('City is required'),
        body('location.zipCode').optional().trim().isString(),
        body('location.googlePlaceId').optional().trim().isString(),

        body('tickets').isArray({ min: 1 }).withMessage('At least one ticket type is required'),
        body('tickets.*.name')
            .trim()
            .notEmpty()
            .withMessage('Ticket name required')
            .custom((value, { req }) => {
                const ticketNames = req.body.tickets.map((ticket) => ticket.name.trim());
                const uniqueNames = new Set(ticketNames);

                if (uniqueNames.size !== ticketNames.length) {
                    throw new Error('Duplicate ticket names are not allowed.');
                }
                return true;
            }),
        body('tickets.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
        body('ticket.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('tickets').custom((tickets, { req }) => {
            const eventType = req.body.eventType;
            if (eventType === EventType.FREE) {
                for (let t of tickets) {
                    if (t.price > 0) {
                        throw new Error('Free events cannot have paid tickets');
                    }
                }
            }
            return true;
        }),

        body('sessions')
            .optional()
            .isArray()
            .withMessage('sessions must be an array')
            .custom((sessions, { req }) => {
                const mode = req.body.eventMode;
                if (!Array.isArray(sessions) || sessions.length === 0) {
                    throw new Error('At least one session is required');
                }

                if (mode === EventMode.SINGLE && sessions.length !== 1) {
                    throw new Error('Single event mode requires exactly one session');
                }

                for (let s of sessions) {
                    const test = 'asdasdsa';
                    if (!s.startDate || !s.endDate) {
                        throw new Error('Each session must have startDate and endDate');
                    }

                    if (new Date(s.startDate) >= new Date(s.endDate)) {
                        throw new Error('startDate must be before endDate');
                    }
                }
                return true;
            }),

        body('type')
            .notEmpty()
            .withMessage('type is required')
            .trim()
            .toLowerCase()
            .isIn(Object.values(EventType))
            .withMessage(`eventType must be ${Object.values(EventType).join(',')}`),
        body('mode')
            .notEmpty()
            .withMessage('mode is required')
            .trim()
            .toLowerCase()
            .isIn(Object.values(EventMode))
            .withMessage(`eventMode must be ${Object.values(EventMode).join(',')}`),
    ],
};

export default organizerValidation;
