import eventService from './eventService.js';
import categoryService from './categoryService.js';

const homeService = {
    async latestEvents({ selections, relations, limit = 5, page = 1 , orderBy, filters, exclude }) {
        return await eventService.getLatest(
            { selections, exclude, relations, limit, page, orderBy, filters },
        );
    },
    
    async getCategories({ selections, relations, limit = 6, page = 1, orderBy, filters, exclude }) {
        return categoryService.getAll(
            { selections, exclude, relations, limit, page, orderBy, filters },
        );
    },
};

export default homeService;