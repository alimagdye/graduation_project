import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

function validate(req, res, next) {
    const result = validationResult(req);
    
    if (!result.isEmpty()) {
        const errors = {};
        
        result.array().forEach(err => {
            const field = err.param || err.path || 'general';
            if (!errors[field]) {
                errors[field] = err.msg;
            }
        });
        return sendError(res, 'Invalid data', 422, errors, 422);
    }
    next();
}

export default validate;
