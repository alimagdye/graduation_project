import jwt from 'jsonwebtoken';
import { JWT_KEY, JWT_REKEY } from './../config/env.js';
import { matchPassword , hashPassword} from './../utils/hash.js';
import userService from './userService.js';
import mailService from './mailService.js';
import otpService from './otpService.js';
import { prisma as prismaClient } from '../config/db.js';


const authService = {
    async register(user) {
        const createdUser = await userService.create(user);

        if (createdUser.status === 'fail') {
            return createdUser;
        }
        
        const token = await authService.generateToken(createdUser);
        
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
        
        const tokenData = await authService.generateToken(exists);

        return {
            data: tokenData,
        };
    },

    async generateToken(user) {
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const expiresIn = 3600;
        const token = jwt.sign(payload, JWT_KEY, { expiresIn });
        const refreshToken = jwt.sign(payload, JWT_REKEY, {expiresIn: '7d'})
        const hashedRefreshToken = await hashPassword(refreshToken);
        await prismaClient.refreshToken.create({
            data: {
                token: hashedRefreshToken,
                userId: user.id,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7*24*60*60*1000)
            }
        })

        return {
            accessToken: token,
            refreshToken: refreshToken,
            type: 'Bearer',
            expiresIn: expiresIn,
        };
    },

    async refreshToken(refreshToken){
        const allTokens = await prismaClient.refreshToken.findMany();
        let validToken = null;

        for(const tokenRecord of allTokens){
            const isTokenValid = await matchPassword(refreshToken, tokenRecord.token);
            if(isTokenValid){ validToken = tokenRecord; break;}
        }

        if(!validToken){
            return {
                status: 'fail',
                data: {error: 'Invalid refresh token'}
        }}

        if(validToken.expiresAt < new Date()){
            return {
                status: 'fail',
                data: {error: 'Refresh token expired'}
        }}

        if(validToken.isRevoked){
            return{
                status: 'fail',
                data: {error: 'Refresh token revoked'}
            }
        }

        const payload = jwt.verify(refreshToken, JWT_REKEY);

        const newAccessToken = jwt.sign({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
        }, JWT_KEY , {expiresIn : '3600'}
        );

        return newAccessToken;
    },

    async logout(refreshToken, user){
        const userTokens = await prismaClient.refreshToken.findMany({where: {userId: user.id}});
        let tokenToRevoke = null;

        for (const tokenRecord of userTokens){
            const isTokenValid = await matchPassword(refreshToken, tokenRecord.token);
            if(isTokenValid){tokenToRevoke = tokenRecord; break;}
        }
        if(!tokenToRevoke){
            return{
                status: 'fail',
                data: {error: 'Refresh token not found'}
            }
        }

        await prismaClient.refreshToken.update({
            where: {id: tokenToRevoke.id},
            data:  {isRevoked: true},
        })
    },

    async resetPassword(email, token, newPassword){
        const record = await prismaClient.resetPasswordToken.findFirst({
            where: {email , token},
        });

        if(!record) return {status:'fail' , data: {error: 'Invalid token'}};

        const now = new Date();
        if(now > new Date(record.expiresAt)){
            await prismaClient.resetPasswordToken.delete({where: {id: record.id}});
            return {status: 'fail' , data:{error: 'Token expired'}};
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await prismaClient.user.update({
            where: {email},
            data: {password: hashedNewPassword},
        });

        await prismaClient.resetPasswordToken.delete({where : {id: record.id}});

        return { status: 'success', data: { message: "Password reset successfully" } };

    },

    async createPasswordToken(email , token){
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        return prismaClient.passwordResetToken.create({
            data: {email:email, token:token, expiresAt: expiresAt},
        })
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
