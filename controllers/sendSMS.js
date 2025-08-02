const { db } = require("../firebaseConfig");
const { sendSingleWhatsAppMessage } = require("../utils/sendSMS");
const { FormatDateTime } = require("../utils/FormatDateTime");

const getWorkersPhoneNumbers = async (createdBy) => {
  try {
    let query = db.collection("workerCollection");
    if (createdBy) {
      query = query.where("createdBy", "==", createdBy);
    }
    const snapshot = await query.get();
    const workers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const phoneNumbers = workers
      .map((worker) => {
        let number = worker.phoneNumber;
        if (number && typeof number === "string") {
          if (number.length === 10) {
            return "+91" + number;
          }
          if (number.startsWith("91") && number.length === 12) {
            return "+" + number;
          }
          if (number.startsWith("+")) {
            return number;
          }
        }
        return null;
      })
      .filter((number) => number !== null);

    return phoneNumbers;
  } catch (error) {
    console.error("Error fetching worker phone numbers:", error.message);
    throw new Error("Failed to retrieve worker phone numbers.");
  }
};

const sendWhatsAppSMSController = async (req, res) => {
  const { message, dateTime, location, visitId } = req.body;
  const createdBy = req.user.email; // or req.user.id

  if (!message || !dateTime || !location) {
    return res
      .status(400)
      .json({ error: "Message, dateTime, and location are required." });
  }

  let recipients;
  try {
    recipients = await getWorkersPhoneNumbers(createdBy);
    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ error: "No workers found for this user." });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  let formattedDateTime;
  if (
    dateTime &&
    typeof dateTime === "object" &&
    "date" in dateTime &&
    "time" in dateTime
  ) {
    formattedDateTime = `${dateTime.date} at ${dateTime.time}`;
  } else if (
    dateTime &&
    typeof dateTime === "object" &&
    typeof dateTime.toDate === "function"
  ) {
    formattedDateTime = FormatDateTime(dateTime.toDate().toISOString());
  } else if (
    dateTime &&
    typeof dateTime === "object" &&
    "seconds" in dateTime
  ) {
    formattedDateTime = FormatDateTime(
      new Date(dateTime.seconds * 1000).toISOString()
    );
  } else if (typeof dateTime === "string" || typeof dateTime === "number") {
    formattedDateTime = FormatDateTime(new Date(dateTime).toISOString());
  } else if (dateTime instanceof Date) {
    formattedDateTime = FormatDateTime(dateTime.toISOString());
  } else {
    formattedDateTime = "Invalid date";
  }

  const fullMessage =
    `Hello,\n\n` +
    `${message}\n\n` +
    `📍 Location: ${location}\n` +
    `⏰ Time: ${formattedDateTime}\n\n` +
    `Thank you.`;

  const results = [];
  for (const number of recipients) {
    const result = await sendSingleWhatsAppMessage(number, fullMessage, false);
    results.push({ number, ...result });
  }

  let updatedVisit = null;
  if (visitId) {
    try {
      await db
        .collection("visitCollection")
        .doc(visitId)
        .update({ isSent: true });
      const updatedVisitSnap = await db
        .collection("visitCollection")
        .doc(visitId)
        .get();
      const rawVisitData = updatedVisitSnap.data();

      updatedVisit = {
        id: visitId,
        ...rawVisitData,
        isSent: true,
      };

      if (
        rawVisitData.dateTime &&
        typeof rawVisitData.dateTime.toDate === "function"
      ) {
        const jsDate = rawVisitData.dateTime.toDate();
        updatedVisit.dateTime = FormatDateTime(jsDate.toISOString());
      } else if (
        rawVisitData.dateTime &&
        typeof rawVisitData.dateTime === "object" &&
        "date" in rawVisitData.dateTime &&
        "time" in rawVisitData.dateTime
      ) {
        updatedVisit.dateTime = rawVisitData.dateTime;
      } else if (typeof rawVisitData.dateTime === "string") {
        updatedVisit.dateTime = FormatDateTime(rawVisitData.dateTime);
      } else {
        console.warn(
          `Unexpected dateTime format for raw visit data ${visitId}:`,
          rawVisitData.dateTime
        );
        updatedVisit.dateTime = { date: "N/A", time: "N/A" };
      }

      console.log(
        "Backend sending FINAL updatedVisit to frontend:",
        updatedVisit
      );
    } catch (updateError) {
      console.error(
        `Failed to update isSent for visit ${visitId}:`,
        updateError
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "WhatsApp messages sent.",
    results,
    updatedVisit,
  });
};

const sendScheduleWhatsAppSMSController = async (req, res) => {
  const { scheduleId, date, slots, messages } = req.body;
  const createdBy = req.user.email;

  if (!date || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: "Date and slots are required." });
  }

  console.log(
    "sendScheduleWhatsAppSMSController - Received payload:",
    req.body
  );

  let recipients;
  try {
    recipients = await getWorkersPhoneNumbers(createdBy);
    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ error: "No workers found for this user." });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  let fullMessage = `📅 Scheduled Activities\n\n`;
  fullMessage += `🗓️ Date: ${date}\n`;

  // Each slot should be an object: { time, message, location }
  slots.forEach((slot, idx) => {
    if (
      typeof slot === "object" &&
      slot.time &&
      slot.message &&
      slot.location
    ) {
      fullMessage += `\n⏰ Time: ${slot.time}\n`;
      fullMessage += `📝 Message: ${slot.message}\n`;
      fullMessage += `📍 Location: ${slot.location}\n`;
    } else if (typeof slot === "string") {
      fullMessage += `\n⏰  Time: ${slot}\n`;
      if (Array.isArray(messages) && messages[idx]) {
        fullMessage += `📝 Message: ${messages[idx]}\n`;
      }
    }
  });

  const results = [];
  for (const number of recipients) {
    const result = await sendSingleWhatsAppMessage(number, fullMessage, false);
    results.push({ number, ...result });
  }

  let updatedSchedule = null;
  if (scheduleId) {
    try {
      await db
        .collection("scheduleCollection")
        .doc(scheduleId)
        .update({ isSent: true });
      const updatedScheduleSnap = await db
        .collection("scheduleCollection")
        .doc(scheduleId)
        .get();
      updatedSchedule = updatedScheduleSnap.data();
      updatedSchedule.id = scheduleId;
      console.log("Updated schedule:", updatedSchedule);
    } catch (updateError) {
      console.error(
        `Failed to update isSent for schedule ${scheduleId}:`,
        updateError
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "WhatsApp messages sent for schedule.",
    results,
    updatedSchedule,
  });
};

module.exports = {
  sendWhatsAppSMSController,
  sendScheduleWhatsAppSMSController,
};
