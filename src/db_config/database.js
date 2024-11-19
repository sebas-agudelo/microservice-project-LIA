import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

export const dbConnection = async () => {
  try {
    const Poll = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("Ansluten till databasen!");
    return Poll;
  } catch (err) {
    console.error("Fel vid anslutning till databasen:", err);
  }
};
