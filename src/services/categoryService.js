import { prisma as prismaClient } from '../config/db.js';
import { PrismaQueryBuilder } from '../utils/queryBulider.js';

const categoryService = {
    DEFAULT_SELECTIONS: {
        id: true,
        name: true,
        createdAt: true,
    },
    
    DEFAULT_EXCLUDE_FIELDS: {
        updatedAt: true,
    },

    DEFAULT_RELATIONS: {},
    
    ALLOWED_RELATIONS: ['events'],
    
    MAX_LIMIT: 100,
    
    async getByCategory(categoryName, tx = prismaClient){
        return tx.category.findUnique({
            where: {name: categoryName},
        });
    },
    
    async getAll({ selections, relations, exclude, limit, page, orderBy, filters } = {}) {
        const query = new PrismaQueryBuilder({
            maxLimit: categoryService.MAX_LIMIT,
            allowedRelations: categoryService.ALLOWED_RELATIONS
        })
            .paginate(page, limit)
            .sort(orderBy || { createdAt: 'desc' })
            .select(selections || categoryService.DEFAULT_SELECTIONS)
            .include(relations || categoryService.DEFAULT_RELATIONS)
            .omit(exclude || categoryService.DEFAULT_EXCLUDE_FIELDS)
            .where(filters || {})
            .value;
        
        return prismaClient.category.findMany(query);
    },
}

export default categoryService;