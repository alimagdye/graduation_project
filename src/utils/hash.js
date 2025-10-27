import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function matchPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export { hashPassword, matchPassword };
