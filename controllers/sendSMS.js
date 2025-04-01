const { db } = require("../firebaseConfig");
const { sendSMS } = require("../utils/sendSMS");
const { FormatDateTime } = require("../utils/FormatDateTime");

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

    const { message, location, isSent } = visitDoc.data();

    // console.log("message: ", message);
    // console,location("dateTime: ", dateTime);
    // console.log("location: ", location);

    if (!message || !location) {
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

                                📍 Location: ${location}

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

module.exports = { sendSMSController };
