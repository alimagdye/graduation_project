import express from 'express';
const app = express();

//! BEFORE MIDDLEWARES
import { cors, corsOptions } from './config/cors.js';
import { activityLogger } from './middlewares/activityLogger.js';


//! ROUTES
import authRoutes from './routes/auth.routes.js';

app.use(cors(corsOptions));
app.use(activityLogger);
app.use(express.json());


app.use('/api/v1/auth', authRoutes);


export default app;
