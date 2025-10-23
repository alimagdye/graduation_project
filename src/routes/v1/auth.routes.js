import express from 'express';
const router = express.Router();

import authController from '../../controllers/v1/authController.js';
import authValidations from '../../validations/authValidation.js';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import { authLimiter, emailLimiter } from '../../middlewares/rateLimiter.js';

router.post('/register', authLimiter, authValidations.register, validate, authController.register);

router.post('/verify-otp', authLimiter, auth, authValidations.verifyOtp, validate, authController.verifyOtp);

router.post('/resend-otp', emailLimiter, auth, authValidations.verifyOtp, authController.resendOtp);

router.post('/login', authLimiter, authValidations.login, validate, authController.login);

export default router;
