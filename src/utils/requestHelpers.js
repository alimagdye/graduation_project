function parsePagination(query,  defaultLimit = 10, maxLimit = 50, defaultPage = 1) {
    let limit = parseInt(query.limit, 10) || defaultLimit;
    let page = parseInt(query.page, 10) || defaultPage;

    if (limit > maxLimit) {
        limit = maxLimit;
    }
    if (page < 1) {
        page = 1;
    }
    
    return { limit, page };
}


export { parsePagination };