const { db } = require("../firebaseConfig");
const {
  // sendSMS,
  sendSingleWhatsAppMessage,
} = require("../utils/sendSMS");
const { FormatDateTime } = require("../utils/FormatDateTime");

const getWorkersPhoneNumbers = async () => {
  try {
    const snapshot = await db.collection("workerCollection").get();
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

const twilioWhatsAppController = async (req, res) => {
  const { visitId } = req.body;

  if (!visitId) {
    return res.status(400).json({ message: "visitId not provided" });
  }

  let recipientNumbers;
  let visitDoc;
  let message, location, isSent, dateTime;

  try {
    recipientNumbers = await getWorkersPhoneNumbers();
    if (!recipientNumbers || recipientNumbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No worker phone numbers found in the database.",
      });
    }

    const visitRef = db.collection("visitCollection").doc(visitId);
    visitDoc = await visitRef.get();

    if (!visitDoc.exists) {
      return res.status(404).json({ message: "Visit not found" });
    }

    ({ message, location, isSent, dateTime } = visitDoc.data());

    if (!message || !location || !dateTime) {
      return res.status(400).json({
        message:
          "Missing required visit details (message, location, or dateTime).",
      });
    }
    if (isSent) {
      return res
        .status(400)
        .json({ message: "WhatsApp message already sent for this visit." });
    }
  } catch (error) {
    console.error(
      "Error in twilioWhatsAppController data fetching/validation:",
      error.message
    );
    return res.status(500).json({
      success: false,
      message:
        error.message || "An unexpected error occurred during data retrieval.",
    });
  }

  const templateContentSid = process.env.TWILIO_VISIT_TEMPLATE_SID; // e.g., 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

  if (!templateContentSid) {
    return res.status(500).json({
      success: false,
      message:
        "WhatsApp templateContentSid is not configured or is a placeholder. Please set it correctly.",
    });
  }

  const isTemplate = true;

  const formattedDateTime = FormatDateTime(dateTime.toDate().toISOString());

  const templateVariables = {
    1: message, // Value for {{1}}
    2: location, // Value for {{2}}
    3: formattedDateTime, // Value for {{3}}
  };

  // const isTemplate = false;
  // const templateContentSid = null;
  // const templateVariables = {};

  // const messageBody = `Hello dear member,
  //                               ${message}

  //                               📍Location: ${location}
  //                               ⌚ Time: ${formattedDateTime}

  //                               Thank you.`;

  const results = [];
  for (const number of recipientNumbers) {
    const result = await sendSingleWhatsAppMessage(
      number,
      null,
      isTemplate,
      templateContentSid,
      templateVariables
    );
    results.push({ number, ...result });
  }

  try {
    const visitRef = db.collection("visitCollection").doc(visitId);
    await visitRef.update({ isSent: true });
    console.log(`Visit ${visitId} 'isSent' status updated to true.`);
  } catch (updateError) {
    console.error(
      `Error updating isSent status for visit ${visitId}:`,
      updateError.message
    );
  }

  res.status(200).json({
    success: true,
    message: "WhatsApp message sending initiated successfully.",
    totalRecipients: recipientNumbers.length,
    results: results,
  });
};

const sendSMSController = async (req, res, next) => {
  const { visitId } = req.body;

  // console.log("visitId: ", visitId);

  if (!visitId) {
    return res.status(500).json({ message: "visitId not provided" });
  }

  try {
    // Fetch visit details using visitId
    const visitRef = db.collection("visitCollection").doc(visitId);
    const visitDoc = await visitRef.get();

    if (!visitDoc.exists) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const { message, location, dateTime, isSent } = visitDoc.data();

    // console.log("message: ", message);
    // console,location("dateTime: ", dateTime);
    // console.log("location: ", location);

    if (!message || !location || !dateTime) {
      return res
        .status(400)
        .json({ message: "Missing required visit details" });
    }

    // Prevent resending SMS if already sent
    if (isSent) {
      return res
        .status(400)
        .json({ message: "SMS already sent for this visit" });
    }

    // Fetch all workers from the database
    const workersSnapshot = await db.collection("workerCollection").get();

    if (workersSnapshot.empty) {
      return res.status(404).json({ message: "No workers found" });
    }

    // Extract phone numbers and create a comma-separated string
    const phoneNumbers = workersSnapshot.docs
      .map((doc) => doc.data().phone)
      .filter((phone) => phone);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: "No valid phone numbers found" });
    }

    const phoneNumbersString = phoneNumbers.join(",");

    const createdMessage = `Hello dear member,
                                ${message}

                                📍Location: ${location}
                                ⌚ Time: ${dateTime} 

                                Thank you.`;

    const visitDetails = {
      numbers: phoneNumbersString,
      message: createdMessage,
    };

    // console.log("visitDetails: ", visitDetails);

    // Send SMS using the utility function
    await sendSMS({ visitDetails });

    // Update the visit document to set isSent to true
    await visitRef.update({ isSent: true });

    // Fetch the updated visit data
    const updatedVisitDoc = await visitRef.get();
    const updatedVisit = updatedVisitDoc.data();

    const date = updatedVisit.dateTime.toDate(); // Convert Firestore Timestamp to JavaScript Date
    const cleanDateTime = FormatDateTime(date.toISOString());

    const sentVisit = {
      id: visitRef.id,
      createdBy: updatedVisit.createdBy,
      dateTime: cleanDateTime,
      location: updatedVisit.location,
      message: updatedVisit.message,
      isSent: updatedVisit.isSent,
    };

    console.log("sentVisit: ", sentVisit);

    res
      .status(200)
      .json({ message: "SMS sent successfully", sentVisit: sentVisit });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res
      .status(500)
      .json({ message: "Failed to send SMS", error: error.message });
  }
};

// SendScheduleSMS
const sendScheduleSMSController = async (req, res, next) => {
  const { scheduleId } = req.body;
  console.log("scheduleId: ", scheduleId);
  if (!scheduleId) {
    return res.status(500).json({ message: "scheduleId not provided" });
  }

  try {
    // Fetch schedule details using scheduleId
    const scheduleRef = db.collection("scheduleCollection").doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const { date, slots, isSent } = scheduleDoc.data();

    console.log("date: ", date);
    console.log("slot: ", slots);
    console.log("isSent: ", isSent);

    if (!date || !slots) {
      return res
        .status(400)
        .json({ message: "Missing required schedule details" });
    }

    // Prevent resending SMS if already sent
    if (isSent) {
      return res
        .status(400)
        .json({ message: "SMS already sent for this schedule" });
    }

    // Fetch all workers from the database
    const workersSnapshot = await db.collection("workerCollection").get();

    if (workersSnapshot.empty) {
      return res.status(404).json({ message: "No workers found" });
    }

    // Extract phone numbers and create a comma-separated string
    const phoneNumbers = workersSnapshot.docs
      .map((doc) => doc.data().phoneNumber)
      .filter((phone) => phone);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ message: "No valid phone numbers found" });
    }

    const phoneNumbersString = phoneNumbers.join(",");

    const createdMessage =
      `Hello dear member, the schedule for the day ${date} is as follows:\n\n` +
      slots
        .map(
          (slot, index) =>
            `${index + 1}. ${slot.time} at location : ${slot.location} --> ${
              slot.message
            }`
        )
        .join("\n") +
      `\n\nThank you.`;

    const visitDetails = {
      numbers: phoneNumbersString,
      message: createdMessage,
    };

    // console.log("visitDetails: ", visitDetails);

    // Send SMS using the utility function
    await sendSMS({ visitDetails });

    if (!sendSMS) {
      return res.status(500).json({ message: "Failed to send SMS" });
    }

    // Update the visit document to set isSent to true
    await scheduleRef.update({ isSent: true });

    // Fetch the updated visit data
    const updatedScheduleDoc = await scheduleRef.get();
    const updatedSchedule = updatedScheduleDoc.data();

    const sentSchedule = {
      id: scheduleRef.id,
      schedule: updatedSchedule.schedule,
    };

    console.log("sentSchedule: ", sentSchedule);

    res
      .status(200)
      .json({ message: "SMS sent successfully", sentSchedule: sentSchedule });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res
      .status(500)
      .json({ message: "Failed to send SMS", error: error.message });
  }
};

module.exports = {
  sendSMSController,
  sendScheduleSMSController,
  twilioWhatsAppController,
};
// module.exports = { sendSMSController };
