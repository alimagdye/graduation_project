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

            const { accessToken, refreshToken} = result.token;

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            return sendSuccess(res, accessToken, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async refreshToken(req, res){
        try{
            const token = req.cookies.refreshToken;
            if(!token) return sendFail(res, { message: 'No refresh token' }, 401);

            const newAccessToken = await authService.refreshToekn(token);

            return sendSuccess(res, { accessToken: newAccessToken }, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'nvalid or expired refresh token', 'INVALID_REFRESH', null, 403);
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

    async requestResetPassword(req, res) {
    try {
        const { email } = req.body;
        const user = { email };

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

    async resetPassword(req, res){
        try{
            const {email, otp, newPassword} = req.body;

            const result = await authService.resetPassword(email, otp, newPassword);

            if(result.status === 'fail') return sendFail(res, result.data, 400);

            return sendSuccess(res, result.data, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    }
};

export default authController;
