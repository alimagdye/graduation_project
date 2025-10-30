import jwt from 'jsonwebtoken';
import { JWT_KEY, JWT_REKEY } from './../config/env.js';
import { matchPassword , hashPassword} from './../utils/hash.js';
import userService from './userService.js';
import mailService from './mailService.js';
import otpService from './otpService.js';

const authService = {
    async register(user) {
        const createdUser = await userService.create(user);

        if (createdUser.status === 'fail') {
            return createdUser;
        }
        
        const token = authService.generateToken(createdUser);
        
        await authService.sendOtpMail(user, true);
        
        return {
            createdUser,
            token,
        };
    },

    async login(user) {
        const exists = await userService.findByEmail(user.email);

        if (!exists) {
            return {
                status: 'fail',
                data: { error: 'Invalid credentials' },
            };
        }

        const isPasswordValid = await matchPassword(user.password, exists.password);

        if (!isPasswordValid) {
            return {
                status: 'fail',
                data: { error: 'Invalid credentials' },
            };
        }
        
        const tokenData = authService.generateToken(exists);

        return {
            status: 'success',
            token: tokenData,
        };
    },

    generateToken(user) {
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const expiresIn = 3600;
        const token = jwt.sign(payload, JWT_KEY, { expiresIn });
        const refreshToekn = jwt.sign(payload, JWT_REKEY, {expiresIn: '7d'})

        return {
            accessToken: token,
            refreshToken: refreshToekn,
            type: 'Bearer',
            expiresIn: expiresIn,
        };
    },

    async refreshToekn(refreshToekn){
        const payload = jwt.verify(refreshToekn, JWT_REKEY);

        const newAccessToken = jwt.sign({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
        }, JWT_KEY , {expiresIn : '3600'}
        );

        return newAccessToken;
    },

    async resetPassword(email, otp, newPassword){
        const user = await userService.findByEmail(email);

        if(!user) return { status: 'fail' , data: {error: `Email doesn't exist`}}

        const otpResult = await otpService.verifyOtp(email, otp);
        if(!otpResult || otpResult.status === 'fail') return {status: 'fail', data: {error: "Invail or expired OTP"}}

        const hashedPassowrd = await hashPassword(newPassword);

        await userService.updatePassword(email, hashedPassowrd);

        await otpService.deleteOtp(email);

        return { status: 'success', data: { message: "Password updated successfully" } };

    },
    
    async sendOtpMail(user, isFirstTime) {
        let userData = user;
        
        if (isFirstTime) {
            userData = await userService.findByEmail(user.email);
        }
        
        if (userData.isVerified) {
            return {
                status: 'fail',
                data: { error: 'Email already verified' }
            };
        }
        
        const otp = otpService.generateOtp();
        
        await Promise.all([
            mailService.sendOtpJob(userData, otp), 
            otpService.storeOrUpdateOtp(userData.email, otp)
        ]);
        
        return {
            status: 'success',
            data: { message: 'OTP sent successfully' }
        };
    },
    
    async verifyOtp(user, otp) {
        const existingUser = await userService.findByEmail(user.email);
        
        if (existingUser.isVerified) {
            return {
                status: 'fail',
                data: { error: 'Email already verified' }
            };
        }
        
        const isValid = await otpService.verifyOtp(user.email, otp);
        
        if (!isValid || isValid.status === 'fail') {
            return isValid;
        }
        await otpService.deleteOtp(user.email);

        return {
            status: 'success',
            data: { message: 'Email verified successfully' }
        };
    },
};

export default authService;
