import { HOSTNAME, PORT } from './config/env.js';
import { connectDB } from './config/db.js';
import './config/redis.js';
import './workers/mailWorker.js';

connectDB();

import app from './app.js';

app.listen(PORT, () => {
    console.log(`APP STARTED ON http://${HOSTNAME}:${PORT}`);
});