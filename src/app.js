import express from "express";
import { config } from "dotenv";
import { dbConnection } from "./db_config/database.js";
import { dailyJob } from "./jobs/dailyMergeJob.js";
import mergeData from "./services/mergeData.js";

config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  try {
    console.log("Ansluten till databasen!");
    console.log(`Servern är igång på PORT ${PORT} ....`);

    dailyJob();

    mergeData()
  } catch (err) {
    console.error("Kunde inte starta servern på grund av databasfel:", err);
    process.exit(1); // Avsluta processen med felkod
  }
});
