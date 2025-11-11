import jwt from 'jsonwebtoken';
import { JWT_KEY, JWT_REKEY } from './../config/env.js';
import { matchPassword , hashPassword, hashToken, matchToken} from './../utils/hash.js';
import userService from './userService.js';
import mailService from './mailService.js';
import otpService from './otpService.js';
import { prisma as prismaClient } from '../config/db.js';
import crypto from 'crypto';
import { FRONT_URL } from '../config/env.js';
import { ref } from 'process';

const authService = {
    async register(user) {
        const createdUser = await userService.create(user);

        if (createdUser.status === 'fail') {
            return createdUser;
        }
        
        const accessToken = await authService.generateAccessToken(createdUser);
        const refreshToken = await authService.generateRefreshToken(createdUser);
        
        await authService.sendOtpMail(user, true);
        
        return {
            data: {
                accessToken: {
                    token: accessToken.accessToken,
                    type: accessToken.type,
                    expiresIn: accessToken.expiresIn,
                },
                refreshToken: refreshToken.refreshToken
            },
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
        
        const accessToken = await authService.generateAccessToken(exists);
        const refreshToken = await authService.generateRefreshToken(exists);


        return {
            data: {
                accessToken: {
                    token: accessToken.accessToken,
                    type: accessToken.type,
                    expiresIn: accessToken.expiresIn,
                },
                refreshToken: refreshToken.refreshToken,
            }
        };
    },

    async generateAccessToken(user) {
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        const expiresIn = 900; // 15min
        const token = jwt.sign(payload, JWT_KEY, { expiresIn });

        return {
            accessToken: token,
            type: 'Bearer',
            expiresIn: expiresIn,
        };
    },

    async generateRefreshToken(user){
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        const expiresIn = 604800; // 7days
        const token = jwt.sign(payload, JWT_REKEY, {expiresIn});
        const hashedRefreshToken = await hashToken(token);

        await prismaClient.refreshToken.create({
            data: {
                token: hashedRefreshToken,
                userId: user.id,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7*24*60*60*1000)
            }
        });

        return {
            refreshToken: token,
        }
    },

    async refreshToken(refreshToken){
        const hashedToken = await hashToken(refreshToken);
        const tokenRecord = await prismaClient.refreshToken.findFirst({
            where:{token: hashedToken}
        });

        if(!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.isRevoked){
            const msg = !tokenRecord ? 'Invalid refresh token':
                        tokenRecord.expiresAt < new Date() ? 'Refresh token expired':
                        'Refresh token revoked';
            
            return {
                status: 'fail',
                data: {error: msg},
            }                
        }

        const payload = jwt.verify(refreshToken, JWT_REKEY);
        const newAccessToken = await authService.generateAccessToken({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role
        });

        return newAccessToken;
    },

    async logout(refreshToken, user){
        const userTokens = await prismaClient.refreshToken.findMany({
            where: {userId: user.id , isRevoked: false}
        });

        let matchedToken = null;
        for(const t of userTokens){
            const isMatch = await matchToken(refreshToken, t.token);
            if(isMatch){
                matchedToken = t;
                break;
            }
        }

        if(!matchedToken){
            return {
            status: 'fail',
            data: {error: 'Refresh token not found or already revoked'}
            };
        }

        await prismaClient.refreshToken.update({
            where: { id: matchedToken.id },
            data: { isRevoked: true }
        });

        await prismaClient.refreshToken.delete({
            where: {id: matchedToken.id}
        })
    },

    async requestResetPassword(email){
        const user = await userService.findByEmail({email});
        if(!user) return {status: 'success', data: {message: 'We have sent you email containing instructions to reset password'}};

        const token = crypto.randomBytes(32).toString('hex');
        await authService.createPasswordToken(email, token);

        const encodedEmail = encodeURIComponent(email);
        const URL = `${FRONT_URL}/reset-password?email=${encodedEmail}&token=${token}`;
        await mailService.sendPasswordResetJob(user, URL);

        return {
            status: 'success',
            data: {message: 'Reset token sent to email'}
        };
    },

    async resetPassword(email, token, newPassword){
        const record = await prismaClient.resetPasswordToken.findFirst({
            where: {email},
            orderBy: {createdAt: 'desc'},
        });

        if(!record) return {status:'fail' , data: {error: 'Invalid token'}};

        const now = new Date();
        if(now > new Date(record.expiresAt)){
            await prismaClient.resetPasswordToken.delete({where: {id: record.id}});
            return {status: 'fail' , data:{error: 'Token expired'}};
        }

        const isValid = await matchToken(token, record.token);
        if(!isValid) return {status: 'fail', data: {error: 'Invalid token'}};

        const hashedNewPassword = await hashPassword(newPassword);

        await userService.updatePassword({
            where: {email},
            data: {password: hashedNewPassword},
        });

        await prismaClient.resetPasswordToken.delete({where : {id: record.id}});

        return { status: 'success', data: { message: "Password reset successfully" } };

    },

    async createPasswordToken(email , token){
        await prismaClient.resetPasswordToken.deleteMany({where: {email}});

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const hashedToken = await hashToken(token);

        return prismaClient.resetPasswordToken.create({
            data: {email:email, token:hashedToken, expiresAt: expiresAt},
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