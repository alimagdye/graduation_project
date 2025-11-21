import { Prisma as prismaClient } from "@prisma/client";

const categoryService = {

    async getByCategory(categoryName, tx= prismaClient){
        return tx.category.findUnique({
            where: {name: categoryName},
        });
    },
}

export default categoryService;