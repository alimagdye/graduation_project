import redis from '../config/redis.js';

const cacheService = {
    async set(key, value, ttl = 3600) {
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        await redis.set(key, data, 'EX', ttl);
    },

    async get(key) {
        const data = await redis.get(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    },

    async remember(key, fetchFunction, ttl = 3600, ...args) {
        let data = await this.get(key);
        if (data !== null) return data;

        data = await fetchFunction(...args);
        await this.set(key, data, ttl);
        return data;
    },

    async del(key) {
        await redis.del(key);
    },

    async exists(key) {
        const result = await redis.exists(key);
        return result === 1;
    },

    async clearAll() {
        await redis.flushall();
        console.log('⚠️ Cache cleared');
    },
};

export default cacheService;
