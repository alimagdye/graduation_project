import express from 'express';
import { publicLimiter } from '../middlewares/rateLimiter.js';
import homeController from '../controllers/homeController.js';

const Router = express.Router();

Router.get('/latest-events', publicLimiter, homeController.latestEvents);

Router.get('/categories', publicLimiter, homeController.allCategories);

export default Router;