import express from "express";
import { config } from "dotenv";
import { dbConnection } from "./db_config/database.js";
import { dailyJob } from "./jobs/dailyMergeJob.js";

config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  try {
    const connection = await dbConnection();
    console.log("Ansluten till databasen!");
    console.log(`Servern är igång på PORT ${PORT} ....`);

    // Starta cron-jobbet
    dailyJob();
    console.log("Cron-jobbet är startat och körs enligt schemat.");
  } catch (err) {
    console.error("Kunde inte starta servern på grund av databasfel:", err);
    process.exit(1); // Avsluta processen med felkod
  }
});
