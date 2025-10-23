import Redis from 'ioredis';
import { REDIS_URL } from './env.js';

const redis = new Redis(REDIS_URL, {
    enableReadyCheck: false,
    enableOfflineQueue: true,
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

redis.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
});

process.on('SIGINT', async () => {
    await redis.quit();
    console.log('Redis connection closed');
    process.exit(0);
});

export default redis;
