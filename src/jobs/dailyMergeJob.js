import cron from "node-cron";
import { dbConnection } from "../db_config/database.js";
import mergeData from "../services/mergeData.js";

export const dailyJob = async () => {
  cron.schedule("* * * * *", async () => {
    console.log("Startar sammanslagningsjobbet (varje minut)...");
    try {
      const connections = await dbConnection();

      for (let i = 0; i < connections.length; i++) {
        const Poll = connections[i].Poll;
        const [participants] = await Poll.query(`
          SELECT * FROM participant
          WHERE created >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);

        if (participants.length === 0) {
          console.log("No participants found in the last 24 hours.");
          continue;
        }

        await mergeData(participants);
      }

      console.log("Sammanslagningsjobb slutfört.");
    } catch (error) {
      console.error("Fel under sammanslagningsjobbet:", error.message);
    }
  });

  console.log("Cron-jobbet är startat och körs varje minut."); // Loggar att cron-jobbet är startat.
};
