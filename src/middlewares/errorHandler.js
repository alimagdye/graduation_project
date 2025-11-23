import {sendError} from '../utils/response.js';

const errorhandler = (err, req, res, next) => { 
const statusCode = err.statuscode || 500; 
const message = err.message || 'Internal Server Error';
const data = err.data || null;
const code = err.code || null;

console.error(err);

return sendError(res, message, code, data, statusCode);
}

export default errorhandler;