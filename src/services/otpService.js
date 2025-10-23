import crypto from 'node:crypto';
import { prisma as prismaClient } from '../config/db.js';
import userService from './userService.js';

const otpService = {
    generateOtp() {
        return crypto.randomInt(100000, 999999).toString();
    },

    async storeOrUpdateOtp(email, code) {
        await prismaClient.otp.upsert({
            where: { email },
            update: {
                code,
                isUsed: false,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
            create: {
                email,
                code,
                isUsed: false,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });
    },

    async verifyOtp(email, otp) {
        const record = await prismaClient.otp.findUnique({ where: { email } });
        
        if (!record || record.code !== otp) {
            return { 
                status: 'fail', 
                data: { message: 'Invalid OTP' }
            };
        }
        
        if (record.isUsed || new Date() > record.expiresAt) {
            return { 
                status: 'fail',
                data: { message: 'OTP expired' }
            };
        }

        await Promise.all([
            this.markUsed(email),
            userService.markVerified(email),
        ]);

        return { 
            status: 'success', 
            data: { message: 'Email verified successfully' }
        };
    },
    
    async markUsed(email) {
        await prismaClient.otp.update({
            where: { email },
            data: { isUsed: true },
        });
    },
};

export default otpService;

