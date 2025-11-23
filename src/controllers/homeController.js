import asyncWrapper from '../middlewares/asyncWrapper.js';
import { parsePagination } from '../utils/requestHelpers.js';
import { sendSuccess } from '../utils/response.js';
import homeService from '../services/homeService.js';

const homeController = {
    latestEvents: asyncWrapper(async (req, res) => {
        const { page, limit } = parsePagination(req.query);
        
        const result = await homeService.latestEvents({
            selections: null,
            relations: null,
        }, {
            limit,
            page
        });
        
        return sendSuccess(res, { events: result });
    }),
    
    allCategories: asyncWrapper(async (req, res) => {
        const { page, limit } = parsePagination(req.query);

        const result = await homeService.getCategories(
            { 
                selections: null, relations: null 
            }, { 
                limit, page 
            }
        );
        return sendSuccess(res, { categories: result });
    }),
};

export default homeController;