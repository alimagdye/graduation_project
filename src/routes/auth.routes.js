import express from 'express';
const Router = express.Router();

import authController from '../controllers/authController.js';
import authValidations from '../validations/authValidation.js';
import validate from '../middlewares/validate.js';
import auth from '../middlewares/auth.js';
import { authLimiter, emailLimiter } from '../middlewares/rateLimiter.js';

Router.post('/register', authLimiter, authValidations.register, validate, authController.register);

Router.post('/verify-otp', authLimiter, auth, authValidations.verifyOtp, validate, authController.verifyOtp);

Router.post('/resend-otp', emailLimiter, auth, authController.resendOtp);

Router.post('/login', authLimiter, authValidations.login, validate, authController.login);

export default Router;