import { faker } from '@faker-js/faker';
import { hashPassword } from './../../src/utils/hash.js';

const PASSWORD = 'password@12345';

async function userFactory() {
    return {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        age: faker.number.int({ min: 18, max: 80 }),
        password: await hashPassword(PASSWORD),
    };
}

export default userFactory;
