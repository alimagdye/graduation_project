import authService from '../../services/authService.js';
import { sendSuccess, sendFail, sendError } from '../../utils/response.js';

const authController = {
    async register(req, res) {
        try {
            const { name, email, age, password } = req.body;
            
            const result = await authService.register({ name, email, age, password });

            if (result.createdUser.status === 'fail') {
                return sendFail(res, result.createdUser.data, 400);
            }

            return sendSuccess(res, { token: result.token }, 201);

        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async verifyOtp(req, res) {
        try {
            const user = req.user;
            const { otp } = req.body;
            
            const result = await authService.verifyOtp(user, otp);
            
            if (result.status === 'fail') {
                return sendFail(res, result.data, 400);
            }

            return sendSuccess(res, result.data, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await authService.login({email, password});

            if (result.status === 'fail') {
                return sendFail(res, result.data, 400);
            }

            return sendSuccess(res, result, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },
    
    async resendOtp(req, res) {
        try {
            const user = req.user;
            
            const result = await authService.sendOtpMail(user, false);
            
            if (result.status === 'fail') {
                return sendFail(res, result.data, 400);
            }

            return sendSuccess(res, result.data, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },
};

export default authController;
