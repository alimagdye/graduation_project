import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '/..', '..');

dotenv.config({
    path: BASE_PATH + '/.env',
    quiet: true,
});


export const APP_NAME = process.env.APP_NAME;
export const HOSTNAME = process.env.HOSTNAME;
export const JWT_KEY = process.env.JWT_KEY;
export const PORT = process.env.PORT || 8000;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const MAIL_HOST = process.env.MAIL_HOST;
export const MAIL_PORT = process.env.MAIL_PORT;
export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_PASS = process.env.MAIL_PASS;
export const MAIL_FROM = process.env.MAIL_FROM;
export const REDIS_URL = process.env.REDIS_URL || 'redis://';
export { BASE_PATH };
