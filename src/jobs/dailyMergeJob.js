import mergeData from "../services/mergeData.js"; // Standardimport
import cron from "node-cron";

export const dailyJob = async () => {
  cron.schedule("40 * * * *", async () => {
    console.log("Startar sammanslagningsjobbet (varje minut)...");
    try {
      await mergeData(); // Kör mergeData-funktionen
      console.log("Sammanslagningsjobb slutfört.");
    } catch (error) {
      console.error("Fel under sammanslagningsjobbet:", error.message);
    }
  });

  console.log("Cron-jobbet är startat och körs varje minut.");
};
