import { dbConnection } from "../db_config/database.js";

export default async function mergeData() {
  function formatDateForMySQL(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

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

      participants.forEach((participant) => {
        let phone = participant.telephone;

        phone = phone.replace(/^0/, "46").replace(/^\+46/, "46");

        console.log(phone);

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
            all_dates: new Set(),
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            phone,
          };
        }
        const data = mergedData[phone];
        const paidCount = participants.filter(
          (p) =>
            p.recurring_history === "14" &&
            p.telephone === participant.telephone
        ).length;

        if (participant.location) data.locations.add(participant.location);
        data.participants_id.add(participant.id);
        data.total_amount += +participant.amount;
        if (participant.coupon_sent) data.giftcards_sent++;
        data.quiz_answers += parseFloat(participant.points_scored) || 0;
        data.custom_field_1 += parseFloat(participant.time_spent) || 0;
        data.custom_field_2 += parseInt(participant.sms_parts) || 0;
        data.custom_field_3 += parseFloat(participant.sms_cost) || 0;
        console.log(
          `Before incrementing, custom_field_5 for phone ${data.phone}:`,
          data.custom_field_5
        );
        data.custom_field_5 += 1;
        console.log(
          `After incrementing, custom_field_5 for phone ${data.phone}:`,
          data.custom_field_5
        );
        data.affiliated_leads_generated += participant.receiver_phone ? 1 : 0;
        data.affiliated_money_generated += parseFloat(participant.amount) || 0;

        if (paidCount === 1) {
          data.all_dates.delete(`Paid x${paidCount}`);
          data.all_dates.add("Paid");
          data.tags = `${paidCount}`;
        } else if (paidCount > 1) {
          data.all_dates.delete("Paid");
          data.all_dates.add(`Paid x${paidCount}`);
          data.tags = `${paidCount}`;
        } else {
          data.all_dates.delete("Paid");
          data.all_dates.delete(`Paid x${paidCount}`);
          data.tags = "0";
        }

        if (participant.recurring_history === "6") {
          data.all_dates.add("Petition");
        }

        if (participant.recurring_history === "4" && participant.game_type) {
          data.all_dates.add(participant.game_type);
        }

        if (participant.coupon_sent && participant.receiver_phone) {
          const couponCount = participants.filter(
            (p) => p.receiver_phone
          ).length;
          data.all_dates.add(`Giftcards Sent x${couponCount}`);
        }

        if (participant.agree_download_report === 0) {
          data.all_dates.add("No newsletter");
        }
        if (participant.recurring_history === "16") {
          const recurringMonths = parseInt(participant.amount, 10) || 0;
          const monthString =
            recurringMonths === 1 ? "1 month" : `${recurringMonths} months`;
          mergedData[phone].all_dates.add(monthString);
        }

        if (participant.created) {
          const createdDate = new Date(participant.created);
          if (!isNaN(createdDate)) {
            const currentDate = new Date();
            const diffInDaysCreated = Math.floor(
              (currentDate - createdDate) / (1000 * 60 * 60 * 24)
            );
            mergedData[phone].custom_field_5 = `${diffInDaysCreated} days`;
          }

          if (participant.custom_timestamp_3) {
            const customTimestamp3 = new Date(participant.custom_timestamp_3);
            if (!isNaN(customTimestamp3)) {
              const diffInDaysCustom = Math.floor(
                (customTimestamp3 - createdDate) / (1000 * 60 * 60 * 24)
              );
              mergedData[
                phone
              ].custom_field_5 += ` (${diffInDaysCustom} days since custom timestamp)`;
            }
          }
        }

        if (participant.name) data.name = participant.name;
        if (participant.email) data.email = participant.email;
        if (participant.address) data.address = participant.address;
        if (participant.postcode) data.zip = participant.postcode;
        if (participant.city) data.city = participant.city;
        if (participant.personal_number)
          data.personal_number = participant.personal_number;
        if (participant.modified > data.latest_date)
          data.latest_date = participant.modified;
        data.created = formatDateForMySQL(new Date());
        data.modified = formatDateForMySQL(new Date());

        if (
          participant.custom_text4 &&
          typeof participant.custom_text4 === "string"
        ) {
          const consentStatus = participant.custom_text4.split(" ");
          const activeCount = consentStatus.filter(
            (status) => status === "Active"
          ).length;
          const deletedCount = consentStatus.filter(
            (status) => status === "Deleted"
          ).length;
          mergedData[
            phone
          ].custom_field_4 = `Active x${activeCount} Deleted x${deletedCount}`;
        }
      });

      for (const phone in mergedData) {
        const data = mergedData[phone];
        data.locations = Array.from(data.locations).join(", ");
        data.participants_id = Array.from(data.participants_id).join(", ");
        data.all_dates = Array.from(data.all_dates).join(", ");

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
            existingRow.postcode !== data.postcode;

          if (hasChanges) {
            data.modified = formatDateForMySQL(new Date());

            await Poll.query(
              `UPDATE leads SET 
                locations = ?, participants_id = ?, total_amount = ?, 
                giftcards_sent = ?, name = ?, email = ?, address = ?, 
                zip = ?, city = ?, personal_number = ?, quiz_answers = ?, 
                custom_field_1 = ?, custom_field_2 = ?, custom_field_3 = ?, 
                custom_field_4 = ?, custom_field_5 = ?, affiliated_views_generated = ?, 
                affiliated_leads_generated = ?, affiliated_money_generated = ?, 
                tags = ?, all_dates = ?, modified = ? 
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
                data.modified,
                data.phone,
                data.receiver_phone,
              ]
            );

            console.log(`Record updated for phone: ${data.phone}`);
          } else {
            console.log(`No changes for phone: ${data.phone}`);
          }
        } else {
          data.created = formatDateForMySQL(new Date());
          data.modified = data.created;

          await Poll.query(
            `INSERT INTO leads 
            (locations, participants_id, total_amount, giftcards_sent, name, phone, 
             email, address, zip, city, personal_number, quiz_answers, custom_field_1, 
             custom_field_2, custom_field_3, custom_field_4, custom_field_5, 
             affiliated_views_generated, affiliated_leads_generated, 
             affiliated_money_generated, tags, all_dates, created, modified) 
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
              data.created,
              data.modified,
              data.receiver_phone,
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
