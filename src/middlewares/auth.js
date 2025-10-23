import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import { APP_SECRET_KEY } from './../config/env.js';

function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return sendError(res, 'No auth token provided', null, 401);
    }

    try {
        req.user = jwt.verify(token, APP_SECRET_KEY);
        next(); 
    } catch (error) {
        return sendError(res,'Invalid auth token.', null, 403);
    }
}


export default auth;
