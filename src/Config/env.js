const path = require('node:path');
const env = require('dotenv');

const BASE_PATH = path.join(__dirname,'/..','..')


module.exports = {
    BASE_PATH,
    HOSTNAME: process.env.HOSTNAME,
    PORT: process.env.PORT,
    APP_SECRET_KEY: process.env.APP_SECRET_KEY
};