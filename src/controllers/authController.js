import authService from '../services/authService.js';
import { sendSuccess, sendFail, sendError } from '../utils/response.js';

const authController = {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            const result = await authService.register({ name, email, password });

            if (result.status === 'fail') {
                return sendFail(res, result.data, 400);
            }

            return sendSuccess(res, result.data, 201);
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

            return sendSuccess(res, result.data, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async refreshToken(req, res){
        try{
            const { refreshToken } = req.body;
            
            const result = await authService.refreshToken({ refreshToken });
            
            if (!result || result.status === 'fail') {
                return sendFail(res, result.data, 403);
            }
            
            return sendSuccess(res, result, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Invalid or expired refresh token', 'INVALID_REFRESH', null, 403);
        }
    },

    async logout(req,res){
        try{
            const { refreshToken } = req.body;
            const user = req.user;
            const accessToken = req.accessToken;

            const result = await authService.logout({ user, accessToken, refreshToken });
            if (!result || result.status === 'fail') {
                return sendFail(res, result.data, 400);
            }
            return sendSuccess(res, result.data, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Logout failed', 'LOGOUT_ERROR', null, 500);
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

    async requestResetPassword(req, res){
        try {
            const { email } = req.body;
            const result = await authService.requestResetPassword({email});
    
            return sendSuccess(res, result.data, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async resetPassword(req, res){
        try{
            const {email, token, newPassword} = req.body;
            const result = await authService.resetPassword({email, token, newPassword});

            if(result.status === 'fail') return sendFail(res, result.data, 400);

            return sendSuccess(res, result.data, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },
};

export default authController;
