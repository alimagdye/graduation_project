import express from 'express';
const app = express();

//! BEFORE MIDDLEWARES
import { cors, corsOptions } from './config/cors.js';
import { activityLogger } from "./middlewares/activityLogger.js";

app.use(cors(corsOptions));
app.use(activityLogger);
app.use(express.json());


//! ROUTES
import v1Routes from './routes/v1/index.js';

app.use('/api/v1', v1Routes);


export default app;
