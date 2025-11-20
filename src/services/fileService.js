import { STORAGE_TYPE } from '../config/env.js';
import localDriver from './storage/localDriver.js';
const getDriver = () => {
    switch (STORAGE_TYPE) {
        case 'local':
        default:
            return localDriver;
    }
};

const currentDriver = getDriver();

const fileService = {

    /**
     * Saves a file using the active storage driver.
     * @param {Object} file - The file object from Multer
     * @param {string} folder - The subfolder to save into (default: 'tmp')
     */
    async save(file, folder = 'tmp') {
        if (!file) return null;

        const result = await currentDriver.upload(file, folder);

        return {
            disk: STORAGE_TYPE,
            path: result.path,
            url: result.url,
        };
    },

    /**
     * Deletes a file using the active storage driver.
     * @param {string} filePath - The relative path of the file to delete
     */
    async delete(filePath) {
        if (!filePath) return;
        await currentDriver.delete(filePath);
    },
};

export default fileService;