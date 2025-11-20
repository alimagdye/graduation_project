function parseJsonFields(fields) {
    return (req, res, next) => {
        try {
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = JSON.parse(req.body[field]);
                }
            });
            next();
        } catch (error) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid JSON format in form data'
            });
        }
    }
}

export default parseJsonFields;