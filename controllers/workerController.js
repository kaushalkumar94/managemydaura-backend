const { db } = require('../firebaseConfig');

// Add Worker
const addWorker = async (req, res) => {
  const { name, address, phoneNumber } = req.body;

  // Check if all fields are present
  if (!name || !address || !phoneNumber) {
    return res.status(400).json({ error: 'All fields are required to add a worker' });
  }

  try {
    // Check if phoneNumber already exists
    const existingWorker = await db.collection('workerController')
      .where('phoneNumber', '==', phoneNumber)
      .get();

    if (!existingWorker.empty) {
      return res.status(400).json({ error: 'Worker with this phone number already exists' });
    }

    // Store worker data in Firestore
    const newWorker = { name, address, phoneNumber };
    await db.collection('workerController').add(newWorker);
    res.status(201).json({ message: 'Worker added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// List Workers
const listWorkers = async (req, res) => {
  try {
    const snapshot = await db.collection('workerCollection').get();
    const workers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, listWorkers };