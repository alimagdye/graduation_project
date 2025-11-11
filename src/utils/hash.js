import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function matchPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

async function hashToken(token) {
    return await bcrypt.hash(token, SALT_ROUNDS);
}

async function matchToken(token, hashedToken) {
    return await bcrypt.compare(token, hashedToken);
}

export { hashPassword, matchPassword, hashToken, matchToken };
