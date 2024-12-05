import express from "express";
import { config } from "dotenv";
import { dailyJob } from "./jobs/dailyMergeJob.js";
import mergeData from "./services/mergeData.js";


config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.json('Hello World');
})



app.post('/api/insertleads', async (req, res) => {
  try{
    await mergeData();
    res.status(200).send("Leads successfully inserted");

  } catch(error){
    console.log(error);
    
  }
})

app.listen(PORT, async () => {
  try {
    console.log("Ansluten till databasen!");

    // await mergeData();
    dailyJob();

    
    console.log('Hello från app.js');
    

  } catch (err) {
    console.error("Kunde inte starta servern på grund av databasfel:", err);
    process.exit(1); // Avsluta processen med felkod
  }
});
