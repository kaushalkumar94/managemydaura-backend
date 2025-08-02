const { db } = require("../firebaseConfig");
// const sendSMS = require('../config/smsService');
const { FormatDateTime } = require("../utils/FormatDateTime");

const createVisit = async (req, res) => {
  const { createdBy, dateTime, location, message } = req.body;

  if (!createdBy || !dateTime || !location || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const dateTimeObj = new Date(dateTime);

    const visitData = {
      createdBy,
      dateTime: dateTimeObj,
      location,
      message,
      isSent: false,
    };
    const visitRef = await db.collection("visitCollection").add(visitData);

    const newVisitSnapshot = await visitRef.get();
    const newVisit = newVisitSnapshot.data();

    console.log("New Visit:", newVisit);

    const date = newVisit.dateTime.toDate(); // Firestore Timestamp to JavaScript Date
    const cleanDateTime = FormatDateTime(date.toISOString());

    const createdVisit = {
      id: visitRef.id,
      createdBy: newVisit.createdBy,
      dateTime: cleanDateTime,
      location: newVisit.location,
      message: newVisit.message,
      isSent: newVisit.isSent,
    };

    res.status(201).json({ message: "Visit created", newVisit: createdVisit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteVisit = async (req, res) => {
  const visitId = req.params.visitId;

  try {
    if (!visitId) {
      return res.status(400).json({ error: "Visit ID is required" });
    }

    const visitRef = db.collection("visitCollection").doc(String(visitId));
    const docSnapshot = await visitRef.get();

    if (!docSnapshot) {
      return res.status(404).json({ error: "Visit not found" });
    }

    const response = await visitRef.delete();
    const checkAfterDelete = await visitRef.get();

    res.status(200).json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Error deleting visit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createVisit, deleteVisit };
