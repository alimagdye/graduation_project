import { body, param } from 'express-validator';
import SessionStatus from '../constants/enums/sessionStatus.js';
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

        body('description')
            .trim()
            .isString()
            .withMessage('Description must be a string')
            .notEmpty()
            .withMessage('Description is required'),

        body('startDate')
            .trim()
            .isISO8601()
            .withMessage('Start date must be a valid date')
            .notEmpty()
            .withMessage('Start date is required'),

        body('endDate')
            .trim()
            .isISO8601()
            .withMessage('End date must be a valid date')
            .notEmpty()
            .withMessage('End date is required'),

        body('status')
            .optional()
            .isIn(Object.values(SessionStatus))
            .withMessage(`Status must be one of ${Object.values(SessionStatus).join(', ')}`),

        body('banner').custom(async (value, { req }) => {
            if (!req.file) {
                throw new Error('Banner image is required');
            }

            const allowedTypes = ['image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                await fileService.delete(req.file.path);
                throw new Error(`Only .jpg, .png, and .gif formats allowed`);
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
        body('location.city').trim().isString().notEmpty().withMessage('City is required'),
        body('location.zipCode').optional().trim().isString(),
        body('location.googlePlaceId').optional().trim().isString(),

        body('tickets').isArray({ min: 1 }).withMessage('At least one ticket type is required'),
        body('tickets.*.name').trim().notEmpty().withMessage('Ticket name required'),
        body('tickets.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
        body('tickets.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

        body('sessions')
            .optional()
            .isArray()
            .withMessage('sessions must be an array')
            .custom((sessions) => {
                for (let s of sessions) {
                    if (!s.startDate || !s.endDate) {
                        throw new Error('Each session must have startDate and endDate');
                    }
                    if (new Date(s.startDate) >= new Date(s.endDate)) {
                        throw new Error('startDate must be before endDate in each session');
                    }
                }
                return true;
            }),
        body('eventType')
            .notEmpty()
            .withMessage('eventType is required')
            .isIn(Object.values(EventType))
            .withMessage(`eventType must be ${Object.values(EventType).join(',')}`),
        body('eventMode')
            .notEmpty()
            .withMessage('eventMode is required')
            .isIn(Object.values(EventMode))
            .withMessage(`eventMode must be ${Object.values(EventMode).join(',')}`),
    ],

    updateEvent: [
        param('eventId')
            .exists()
            .withMessage('EventID is required')
            .isInt({ gt: 0 })
            .withMessage('EventId must be a postive number'),

        body('title').optional().trim().isString().withMessage('Title must be a string'),

        body('categoryName').optional().isString().withMessage('Category must be a string'),

        body('description')
            .optional()
            .trim()
            .isString()
            .withMessage('Description must be a string'),

        body('location')
            .optional()
            .custom((location) => {
                if (typeof location !== 'object') throw new Error('Location must be an object');
                const { latitude, longitude, name, address, city, country } = location;
                if (latitude !== undefined && (latitude < -90 || latitude > 90))
                    throw new Error('Invalid latitude');
                if (longitude !== undefined && (longitude < -180 || longitude > 180))
                    throw new Error('Invalid longitude');
                if (name !== undefined && typeof name !== 'string')
                    throw new Error('Venue name must be a string');
                if (address !== undefined && typeof address !== 'string')
                    throw new Error('Address must be a string');
                if (city !== undefined && typeof city !== 'string')
                    throw new Error('City must be a string');
                if (country !== undefined && typeof country !== 'string')
                    throw new Error('Country must be a string');
                return true;
            }),

        body('banner').custom(async (value, { req }) => {
            if (!req.file) {
                throw new Error('Banner image is required');
            }

            const allowedTypes = ['image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                await fileService.delete(req.file.path);
                throw new Error(`Only .jpg, .png, and .gif formats allowed`);
            }

            if (req.file.size > 5 * 1024 * 1024) {
                await fileService.delete(req.file.path);
                throw new Error('Image too large (Max 5MB)');
            }

            return true;
        }),

        body('type')
            .optional()
            .isIn(Object.values(EventType))
            .withMessage(`EventType must be one of ${Object.values(EventType).join(', ')}`),

        body('mode')
            .optional()
            .isIn(Object.values(EventMode))
            .withMessage(`EventMode must be one of ${Object.values(EventMode).join(', ')}`),

        body('sessions')
            .optional()
            .isArray()
            .withMessage('Sessions must be an array')
            .custom((sessions, { req }) => {
                for (const s of sessions) {
                    if (!s.startDate || !s.endDate)
                        throw new Error('Each session must have startDate and endDate');
                    if (new Date(s.startDate) >= new Date(s.endDate))
                        throw new Error('StartDate must be before endDate in each session');
                }

                if (req.body.mode === EventMode.SINGLE && sessions.length > 1) {
                    throw new Error('Single mode events can only have one session');
                }
                return true;
            }),

        body('tickets').optional().isArray().withMessage('Tickets must be an array'),

        body('tickets.*.name')
            .optional()
            .trim()
            .isString()
            .withMessage('Ticket name must be a string'),

        body('tickets.*.price').optional().isFloat({ min: 0 }).withMessage('Price must be >= 0'),

        body('tickets.*.quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Quantity must be at least 1'),
    ],
};

export default organizerValidation;
