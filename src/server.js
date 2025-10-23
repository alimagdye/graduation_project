const config = require('./Config/env');
const app = require('./app');
const {connectDB} = require('./Config/db');

connectDB();

app.listen(config.PORT, config.HOSTNAME, () => {
    console.log(`APP RUNNING on http://${config.HOSTNAME}:${config.PORT}`);
})