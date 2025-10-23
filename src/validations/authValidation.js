import { body } from 'express-validator';
import { createRequire } from 'module';

// For JSON imports in ES modules
const require = createRequire(import.meta.url);
const disposableDomains = require('disposable-email-domains');

const authValidations = {
    login: [
        body('email')
            .trim()
            .notEmpty().withMessage('Email cannot be empty')
            .isLength({ max: 255 }).withMessage('Email cannot be that long')
            .isEmail().withMessage('Invalid email format'),

        body('password')
            .trim()
            .notEmpty().withMessage('Password cannot be empty')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    ],

    register: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name cannot be empty')
            .matches(/^[\p{L}\s\-]+$/u).withMessage('Name can only contain letters, spaces, and hyphens'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('Email cannot be empty')
            .isLength({ max: 255 }).withMessage('Email cannot be that long')
            .isEmail().withMessage('Invalid email format')
            .custom((value) => {
                const domain = value.split('@')[1]?.toLowerCase();
                if (disposableDomains.includes(domain)) {
                    throw new Error('Disposable email addresses are not allowed');
                }
                return true;
            }),

        body('age')
            .isInt({ min: 0, max: 100, allow_leading_zeroes: false })
            .withMessage('Age must be an integer between 0 and 100'),

        body('password')
            .trim()
            .notEmpty().withMessage('Password cannot be empty')
            .isStrongPassword({ minLength: 8, returnScore: true }).withMessage('Password must be at least 8 characters long and include a mix of letters, numbers, and symbols'),
    ],
    
    verifyOtp: [
        body('otp')
            .trim()
            .notEmpty().withMessage('OTP cannot be empty')
            .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long')
            .isNumeric().withMessage('OTP must contain only numbers'),
    ],
};

export default authValidations;
