const { db } = require("../firebaseConfig");

const addWorkers = async (req, res) => {
  const { workersData } = req.body;
  const createdBy = req.user.email; // or req.user.id

  if (!workersData || !Array.isArray(workersData) || workersData.length === 0) {
    return res.status(400).json({ error: "Provide an array of workers." });
  }

  for (const worker of workersData) {
    if (!worker.name || !worker.phoneNumber) {
      return res
        .status(400)
        .json({ error: "Each worker must have a name and phoneNumber." });
    }
  }

  try {
    const batch = db.batch();
    const workerCollection = db.collection("workerCollection");

    workersData.forEach((worker) => {
      const docRef = workerCollection.doc();
      batch.set(docRef, {
        name: worker.name,
        phoneNumber: worker.phoneNumber,
        createdBy,
      });
    });

    await batch.commit();

    res
      .status(201)
      .json({
        message: "Workers added successfully.",
        addedWorkers: workersData.length,
      });
  } catch (error) {
    res.status(500).json({ error: "Failed to add workers." });
  }
};

const listWorkers = async (req, res) => {
  try {
    const snapshot = await db.collection("workerCollection").get();
    const workers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ workers: workers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addWorkers,
  listWorkers,
};
