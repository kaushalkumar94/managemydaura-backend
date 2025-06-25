const { db } = require("../firebaseConfig");

// Add Worker
const addWorker = async (req, res) => {
  console.log(req.body);
  console.log("workerData: ", req.body.workersData);

  const { workersData } = req.body;

  if (!workersData || !Array.isArray(workersData) || workersData.length === 0) {
    return res.status(403).json({ message: "Provide valid workers data" });
  }

  try {
    const workerCollection = db.collection("workerCollection");

    // Get all existing phone numbers to avoid duplicates
    const existingWorkersSnapshot = await workerCollection
      .where(
        "phoneNumber",
        "in",
        workersData.map((w) => w.phoneNumber)
      )
      .get();

    const existingPhoneNumbers = new Set();
    existingWorkersSnapshot.forEach((doc) => {
      existingPhoneNumbers.add(doc.data().phoneNumber);
    });

    // Filter out workers that already exist
    const newWorkers = workersData.filter(
      (w) => !existingPhoneNumbers.has(w.phoneNumber)
    );

    if (newWorkers.length === 0) {
      return res.status(400).json({ message: "All workers already exist" });
    }

    // Batch write to Firestore for efficiency
    const batch = db.batch();
    newWorkers.forEach((worker) => {
      const docRef = workerCollection.doc(); // Auto-generate ID
      batch.set(docRef, worker);
    });

    await batch.commit();

    res.status(201).json({
      message: "Workers added successfully",
      addedWorkers: newWorkers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Workers List
const listWorkers = async (req, res) => {
  try {
    const snapshot = await db.collection("workerCollection").get();
    const workers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ workers: workers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addWorker, listWorkers };
