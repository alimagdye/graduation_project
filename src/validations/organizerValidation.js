import { body } from 'express-validator';
import eventStatus from '../constants/enums/eventStatus.js';
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

            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                await fileService.delete(req.file.path);
                throw new Error(`Only .jpg, .png, and .webp formats allowed`);
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

        body('location.state').optional().trim().isString(),
        body('location.zipCode').optional().trim().isString(),
        body('location.googlePlaceId').optional().trim().isString(),

        body('location.capacity')
            .isInt({ min: 1 }).withMessage('Capacity must be a number greater than 0')
            .toInt(),

        body('tickets').isArray({ min: 1 }).withMessage('At least one ticket type is required'),
        body('tickets.*.name').trim().notEmpty().withMessage('Ticket name required'),
        body('tickets.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    ],
};

export default organizerValidation;