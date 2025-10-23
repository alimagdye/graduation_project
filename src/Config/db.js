const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function connectDB() {
    try {
        await prisma.$connect();
        console.log("DATABASE Connected Successfully!");
    } catch (error) {
        console.error("DATABASE Connection Failed:", error.message);
        process.exit(1);
    }
}

module.exports = {
    prisma,
    connectDB
};