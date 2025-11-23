import eventService from './eventService.js';
import categoryService from './categoryService.js';

const homeService = {
    async latestEvents({ selections, relations }, { limit = 5, page = 1 }) {
        return await eventService.getLatest(
            {selections, relations},
            { limit, page}
        );
    },
    
    async getCategories({ selections , relations }, { limit = 6, page = 1 }) {
        return categoryService.getAll(
            { selections, relations },
            { limit, page }
        );
    },
};

export default homeService;