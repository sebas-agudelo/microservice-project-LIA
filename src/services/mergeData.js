import { dbConnection } from "../db_config/database.js";

export default async function mergeData() {
  try {
    const connections = await dbConnection();

    for (let i = 0; i < connections.length; i++) {
      const db = connections[i].db;
      const Poll = connections[i].Poll;

      const [participants] = await Poll.query(`SELECT * FROM participant`);

      if (participants.length === 0) {
        console.log(`No new participants found to process in ${db}.`);
      }

      const mergedData = {};

      // Process participant data as before...
      participants.forEach((participant) => {
        let phone = participant.telephone;

        if (phone.slice(0, 1) === "0") {
          phone = "46" + phone.slice(1);
        } else if (phone.slice(0, 3) === "+46") {
          phone = "46" + phone.slice(3);
        }

        if (!mergedData[phone]) {
          mergedData[phone] = {
            locations: new Set(),
            participants_id: new Set(),
            total_amount: 0,
            giftcards_sent: 0,
            name: participant.name,
            email: participant.email,
            address: participant.address,
            zip: participant.postcode,
            city: participant.city,
            personal_number: participant.personal_number,
            quiz_answers: 0,
            custom_field_1: 0,
            custom_field_2: 0,
            custom_field_3: 0,
            custom_field_4: participant.agree_download_report,
            custom_field_5: 0,
            affiliated_views_generated: participant.affiliated_views_generated,
            affiliated_leads_generated: 0,
            affiliated_money_generated: 0,
            tags: "",
            all_dates: [],
            latest_date: participant.modified,
            paidCounter: 0,
            giftCounter: 0,
            phone,
          };
        }

        const data = mergedData[phone];
        if (participant.location) data.locations.add(participant.location);
        data.participants_id.add(participant.id);
        data.total_amount += +participant.amount;
        if (participant.coupon_sent) data.giftcards_sent++;
        data.quiz_answers += parseFloat(participant.points_scored) || 0;
        data.custom_field_1 += parseFloat(participant.time_spent) || 0;
        data.custom_field_2 += parseInt(participant.sms_parts) || 0;
        data.custom_field_3 += parseFloat(participant.sms_cost) || 0;
        data.custom_field_5 += 1;
        data.affiliated_leads_generated += participant.receiver_phone ? 1 : 0;
        data.affiliated_money_generated += parseFloat(participant.amount) || 0;

        // Update other properties if necessary
        if (participant.name) data.name = participant.name;
        if (participant.email) data.email = participant.email;
        if (participant.address) data.address = participant.address;
        if (participant.postcode) data.zip = participant.postcode;
        if (participant.city) data.city = participant.city;
        if (participant.personal_number)
          data.personal_number = participant.personal_number;
        if (participant.modified > data.latest_date)
          data.latest_date = participant.modified;
        
        if (participant.recurring_history === '14') {
          data.paidCounter++;  
        }
      
        if (participant.recurring_history === '6') {
          if (!data.all_dates.includes('Petition')) {
            data.all_dates.push('Petition'); 
          }
        }

        if(participant.coupon_sent && 
          participant.telephone_receiver_phone !== null && 
          participant.telephone_receiver_phone !== ""){

          data.giftCounter++;
        }

        if(participant.agree_download_report === 0){
            if(!data.all_dates.includes('No newsletter')){
              data.all_dates.push('No newslatter')
            }
        }

        if (participant.recurring_history === "4" && participant.game_type) {
          if (!data.tags.includes(participant.game_type)) {
            data.tags = participant.game_type;
          }
        }
        
      });

      // Insert or update the leads table
      for (const phone in mergedData) {
        const data = mergedData[phone];
        data.locations = Array.from(data.locations).join(", ");
        data.participants_id = Array.from(data.participants_id).join(", ");

        if (data.paidCounter === 1) {
          data.all_dates.push(`Paid`);
        } else if(data.paidCounter > 1){
          data.all_dates.push(`Paid x${data.paidCounter}`);
        }

        if(data.giftCounter === 1){
          data.all_dates.push(`Giftcards sent`);
        } else if(data.giftCounter > 1){
          data.all_dates.push(`${data.giftCounter} Giftcards Sent`)
        }
      
        //Separera strängen med , tecknet. Annars om det inte finns många olika värden behåll det första
        if (data.all_dates.length > 1) {
          data.all_dates = data.all_dates.join(', ');  
        } else {
          data.all_dates = data.all_dates[0];  
        }

        const [existingRows] = await Poll.query(
          `SELECT * FROM leads WHERE phone = ?`,
          [data.phone]
        );

        if (existingRows.length > 0) {
          const existingRow = existingRows[0];
          const hasChanges =
            existingRow.locations !== data.locations ||
            existingRow.participants_id !== data.participants_id ||
            existingRow.total_amount !== data.total_amount ||
            existingRow.name !== data.name ||
            existingRow.email !== data.email ||
            existingRow.address !== data.address ||
            existingRow.postcode !== data.postcode ||
            existingRow.all_dates !== data.all_dates;

          if (hasChanges) {
            await Poll.query(
              `UPDATE leads SET 
                locations = ?, participants_id = ?, total_amount = ?, 
                giftcards_sent = ?, name = ?, email = ?, address = ?, 
                zip = ?, city = ?, personal_number = ?, quiz_answers = ?, 
                custom_field_1 = ?, custom_field_2 = ?, custom_field_3 = ?, 
                custom_field_4 = ?, custom_field_5 = ?, affiliated_views_generated = ?, 
                affiliated_leads_generated = ?, affiliated_money_generated = ?, 
                tags = ?, all_dates = ?, latest_date = ? 
              WHERE phone = ?`,
              [
                data.locations,
                data.participants_id,
                data.total_amount,
                data.giftcards_sent,
                data.name,
                data.email,
                data.address,
                data.zip,
                data.city,
                data.personal_number,
                data.quiz_answers,
                data.custom_field_1,
                data.custom_field_2,
                data.custom_field_3,
                data.custom_field_4,
                data.custom_field_5,
                data.affiliated_views_generated,
                data.affiliated_leads_generated,
                data.affiliated_money_generated,
                data.tags,
                data.all_dates,
                data.latest_date,
                data.phone,
              ]
            );
            console.log(`Record updated for phone: ${data.phone}`);
          } else {
            console.log(`No changes for phone: ${data.phone}`);
          }
        } else {
          await Poll.query(
            `INSERT INTO leads 
            (locations, participants_id, total_amount, giftcards_sent, name, phone, 
             email, address, zip, city, personal_number, quiz_answers, custom_field_1, 
             custom_field_2, custom_field_3, custom_field_4, custom_field_5, 
             affiliated_views_generated, affiliated_leads_generated, 
             affiliated_money_generated, tags, all_dates, latest_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.locations,
              data.participants_id,
              data.total_amount,
              data.giftcards_sent,
              data.name,
              data.phone,
              data.email,
              data.address,
              data.zip,
              data.city,
              data.personal_number,
              data.quiz_answers,
              data.custom_field_1,
              data.custom_field_2,
              data.custom_field_3,
              data.custom_field_4,
              data.custom_field_5,
              data.affiliated_views_generated,
              data.affiliated_leads_generated,
              data.affiliated_money_generated,
              data.tags,
              data.all_dates,
              data.latest_date,
            ]
          );
          console.log(`New record created for phone: ${data.phone}`);
        }
      }
    }

    console.log("Data merged successfully!");
  } catch (error) {
    console.error("Error during mergeData:", error);
  }
  console.log("Kör mergeData...");
}
