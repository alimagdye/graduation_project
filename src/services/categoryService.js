import { prisma as prismaClient } from '../config/db.js';
import { PrismaQueryBuilder } from '../utils/queryBulider.js';
import eventService from "./eventService.js";

const categoryService = {
    DEFAULT_SELECTIONS: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
    },
    
    DEFAULT_EXCLUDE_FIELDS: {
        updatedAt: true,
    },

    DEFAULT_RELATIONS: {
    },
    
    async getByCategory(categoryName, tx = prismaClient){
        return tx.category.findUnique({
            where: {name: categoryName},
        });
    },
    
    async getAll({ selections = categoryService.DEFAULT_SELECTIONS, relations = categoryService.DEFAULT_RELATIONS, exclude = eventService.DEFAULT_EXCLUDE_FIELDS }, { limit = 10, page = 1 }) {
        const query = new PrismaQueryBuilder()
            .paginate(page, limit)
            .select(selections)
            .include(relations)
            .omit(exclude)
            .value;
        
        return prismaClient.category.findMany({
            where: {},
            ...query
        });
    },
}

export default categoryService;