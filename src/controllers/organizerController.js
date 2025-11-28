import asyncWrapper from '../middlewares/asyncWrapper.js';
import { sendSuccess, sendFail } from '../utils/response.js';
import organizerService from '../services/organizerService.js';

const organizerController = {
    createEvent: asyncWrapper(async (req, res) => {
        const userId = req.user.id;
        const banner = req.file;

        let { 
            title, 
            categoryName,
            location,
            description,
            tickets,
            sessions,
            type,
            mode,
        } = req.body;
        
        const result = await organizerService.createEvent(
            userId, { 
            title, 
            categoryName,
            location,
            description,
            banner,
            tickets,
            sessions,
            type,
            mode,
        });
        
        if (result.status === 'fail') {
            return sendFail(res, result.data, 400);
        }
        
        return sendSuccess(res, result.data, 201);
    }),
};


export default organizerController;