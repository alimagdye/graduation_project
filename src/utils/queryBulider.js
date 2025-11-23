class PrismaQueryBuilder {
    constructor() {
        this._pagination = null;
        this._sort = null;
        this._select = null;
        this._include = null;
        this._omit = null;
    }

    paginate(page = 1, limit = 10) {
        this._pagination = { page, limit };
        return this;
    }

    sort(orderBy) {
        if (orderBy) this._sort = orderBy;
        return this;
    }

    select(fields) {
        if (fields && Object.keys(fields).length > 0) this._select = fields;
        return this;
    }

    include(relations) {
        if (relations && Object.keys(relations).length > 0) this._include = relations;
        return this;
    }

    omit(fields) {
        if (fields && Object.keys(fields).length > 0) this._omit = fields;
        return this;
    }
    get value() {
        const query = {};

        if (this._pagination) {
            const p = Math.max(1, parseInt(this._pagination.page));
            const l = Math.max(1, parseInt(this._pagination.limit));
            query.skip = (p - 1) * l;
            query.take = l;
        }

        if (this._sort) {
            query.orderBy = this._sort;
        }

        if (this._select) {
            query.select = {
                ...this._select,
                ...(this._include || {})
            };
        } else {
            if (this._include) query.include = this._include;
            if (this._omit) query.omit = this._omit;
        }

        return query;
    }
}

export  { 
    PrismaQueryBuilder 
};