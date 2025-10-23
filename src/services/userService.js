import { prisma as prismaClient } from '../config/db.js';
import { hashPassword } from './../utils/hash.js';

const userService = {
    async create(user) {
        const existingUser = await this.findByEmail(user.email);
        if (existingUser) {
            return {
                status: 'fail',
                data: { message: 'User already registered' },
            };
        }

        user.password = await hashPassword(user.password);
        
        return prismaClient.user.create({
            data: user
        });
    },

     async findByEmail(email) {
        return prismaClient.user.findFirst({
            where: {email}
        });
    },
    
    async isVerified(userId) {
        return prismaClient.user.findFirst({
            where: {
                id: userId, 
                isVerified: true
            },
        }).isVerified === true;
    },
    
    async markVerified(email) {
        return prismaClient.user.update({
            where: { email: email },
            data: { isVerified: true },
        });
    },
};

export default userService;
