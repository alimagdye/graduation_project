import { body } from 'express-validator';
import eventStatus from '../constants/enums/eventStatus.js';
import EventMode from '../constants/enums/eventMode.js';
import EventType from '../constants/enums/eventType.js';
import fileService from '../services/fileService.js';

const organizerValidation = {
    createEvent: [
        body('title')
            .trim()
            .isString().withMessage('Title must be a string')
            .notEmpty().withMessage('Title is required'),

        body('description')
            .trim()
            .isString().withMessage('Description must be a string')
            .notEmpty().withMessage('Description is required'),

        body('startDate')
            .trim()
            .isISO8601().withMessage('Start date must be a valid date')
            .notEmpty().withMessage('Start date is required'),

        body('endDate')
            .trim()
            .isISO8601().withMessage('End date must be a valid date')
            .notEmpty().withMessage('End date is required'),

        body('status')
            .optional()
            .isIn(Object.values(eventStatus))
            .withMessage(`Status must be one of ${Object.values(eventStatus).join(', ')}`),

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
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('location.name').trim().isString().notEmpty().withMessage('Venue name is required'),
        body('location.address').trim().isString().notEmpty().withMessage('Address is required'),
        body('location.country').trim().isString().notEmpty().withMessage('Country is required'),
        body('location.city').trim().isString().notEmpty().withMessage('City is required'),
        body('location.zipCode').optional().trim().isString(),
        body('location.googlePlaceId').optional().trim().isString(),

        body('tickets').isArray({ min: 1 }).withMessage('At least one ticket type is required'),
        body('tickets.*.name').trim().notEmpty().withMessage('Ticket name required'),
        body('tickets.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
        body('ticket.*.quantity').isInt({min: 1}).withMessage('Quantity must be at least 1'),

        body('sessions').optional().isArray().withMessage('sessions must be an array')
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
        body('eventType').notEmpty().withMessage('eventType is required').isIn(Object.values(EventType)).withMessage(`eventType must be ${Object.values(EventType).join(',')}`),
        body('eventMode').notEmpty().withMessage('eventMode is required').isIn(Object.values(EventMode)).withMessage(`eventMode must be ${Object.values(EventMode).join(',')}`),

    ],
};

export default organizerValidation;