import { HOSTNAME , PORT } from '../config/env.js';
import authService from '../services/authService.js';
import mailService from '../services/mailService.js';
import userService from '../services/userService.js';
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

            return sendSuccess(res, result.data, 200);
        } catch (err) {
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    },

    async refreshToken(req, res){
        try{
            const token = req.cookies.refreshToken;

            if(!token) return sendFail(res, { message: 'No refresh token' }, 401);

            const newAccessToken = await authService.refreshToken(token);

            return sendSuccess(res, { accessToken: newAccessToken }, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Invalid or expired refresh token', 'INVALID_REFRESH', null, 403);
        }
    },

    async logout(req,res){
        try{
            const refreshToken = req.cookies.refreshToken;
            const user = req.user;

            if(!refreshToken || !user){return sendFail(res, {message: 'No refresh token or user info'}, 401);}

            await authService.logout(refreshToken, user);

            //! front-end delete the refresh token from cookies

            return sendSuccess(res, {message: 'Logged out successfully'}, 200);
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

    async requestResetPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await userService.findByEmail(email);

        if(!user) return sendFail(res, { error: 'Email not Found'}, 404 );
       
        const token = crypto.randomBytes(32).toString('hex');
        if(!token) return sendFail(res, {error: 'Something wrong in generate token'}, 404);

        await authService.createPasswordToken(email, token);

        const URL = `http://${HOSTNAME}:${PORT}/reset-password?email=${email}&token=${token}`;

        await mailService.sendPasswordResetJob(user, URL);

        return sendSuccess(res, {message: 'Reset token sent to email'}, 200);

    } catch (err) {
        console.error(err);
        return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
    }
    },

    async resetPassword(req, res){
        try{
            const {email, token, newPassword} = req.body;

            if(!email || !token || !newPassword) return sendFail(res, { error: 'All Email, Token and newPassword fields are required' }, 400);

            const result = await authService.resetPassword(email, token, newPassword);

            if(result.status === 'fail') return sendFail(res, result.data, 400);

            return sendSuccess(res, result.data, 200);
        }catch(err){
            console.error(err);
            return sendError(res, 'Internal server error', 'INTERNAL_ERROR', null, 500);
        }
    }
};
export default authController;
