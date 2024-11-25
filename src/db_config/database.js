import mysql from "mysql2/promise";
import { config } from "dotenv";
import fs from 'fs';

config();

export const dbConnection = async () => {

  try {
    const dbJson = fs.readFileSync('src/dbJson/dbJson.json', 'utf-8');
    const dbJsonData = JSON.parse(dbJson).databases;
  
    console.log(dbJsonData);


    const connections = dbJsonData.map(({db}) => {
      const Poll = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: db,
        waitForConnections: true,
        // connectionLimit: 10,
        queueLimit: 0,
      });
      console.log("Ansluten till databasen!");
      return {db, Poll}
    });

    return connections;
  } catch (err) {
    console.error("Fel vid anslutning till databasen:", err);
  }
};
