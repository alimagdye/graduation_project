function paginate(query) {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    return {
        limit,
        offset,
        page,
    };
}


module.exports = { 
    paginate,
};