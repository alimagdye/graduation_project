import express from 'express';
import helmet from 'helmet';
const app = express();

//! BEFORE MIDDLEWARES
import { cors, corsOptions } from './config/cors.js';
import { activityLogger } from './middlewares/activityLogger.js';


//! ROUTES
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import organizerRoutes from './routes/organizer.routes.js';

app.use(helmet());
app.use(cors(corsOptions));
app.use(activityLogger);
app.use(express.json());


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/organizer', organizerRoutes);

export default app;
