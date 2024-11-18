import express from 'express';
import { config } from 'dotenv';
import { dbConnection } from './db_config/database.js';

config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, async () => {
    const connection = await dbConnection()

    
    console.log(`Servern är igång på PORT ${PORT} ....`);
    
})


