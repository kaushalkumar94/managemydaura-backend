const { db } = require('../firebaseConfig');
// const sendSMS = require('../config/smsService');

// Create Visit and Send SMS
const createVisit = async (req, res) => {
  const { createdBy, dateTime, location, message } = req.body;

  if (!createdBy || !dateTime || !location || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Convert to Date object
    const dateTime = new Date(req.body.dateTime);

    // Store visit data in Firestore
    const visitData = { createdBy, dateTime, location, message };
    const visitRef = await db.collection('visitCollection').add(visitData);

    // Get all Workers
    // const workersSnapshot = await db.collection('userCollection').get();
    // const phoneNumbers = workersSnapshot.docs
    //   .filter(doc => doc.data().phoneNumber)
    //   .map(doc => doc.data().phoneNumber);

    // Send SMS
    // await sendSMS(phoneNumbers, message);

    res.status(201).json({ message: 'Visit created and notifications sent!', visitId: visitRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteVisit = async (req, res) => {
  const visitId = req.params.visitId;

  try {

    // Check if visit exists
    if(!visitId) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    // Delete visit
    const visitRef = db.collection('visitCollection').doc(visitId);
    const docSnapshot = await visitRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    await visitRef.delete();
    res.status(200).json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = { createVisit, deleteVisit };
