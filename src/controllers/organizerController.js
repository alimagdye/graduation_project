import asyncWrapper from '../middlewares/asyncWrapper.js';
import { sendSuccess, sendFail } from '../utils/response.js';
import organizerService from '../services/organizerService.js';

const organizerController = {
    createEvent: asyncWrapper(async (req, res) => {
        const userId = req.user.id;
        
        let { 
            title, 
            category, 
            startDate, 
            endDate, 
            location, 
            description,
            banner,
            tickets,
        } = req.body;
        
        const result = await organizerService.createEvent(
            userId, { 
            title, 
            category, 
            startDate, 
            endDate, 
            location, 
            description,
            banner,
            tickets,
        });
        
        if (result.status === 'fail') {
            return sendFail(res, result.data, 400);
        }
        
        return sendSuccess(res, result.data, 201);
    }),
    
};


export default organizerController;