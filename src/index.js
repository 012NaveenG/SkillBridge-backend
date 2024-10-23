import { DB_Connect } from './utils/DB_Connect.js'
import dotenv from 'dotenv'
import { app } from './app.js'
const PORT = process.env.PORT || 4000

dotenv.config('../.env')


DB_Connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is listening on http://localhost:4000`)
        })
    })



process.on('uncaughtException', function (err) {
    console.log('An error occurred: ', err);
    console.log(err.stack);
});
