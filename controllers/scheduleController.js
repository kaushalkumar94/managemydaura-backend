const admin = require("firebase-admin");

const createSchedule = async (req, res) => {
  const { date, slots } = req.body;
  console.log("Incoming Schedule:", req.body);

  if (!date || !Array.isArray(slots) || slots.length === 0) {
    console.log("Invalid payload received");
    return res.status(400).json({ message: "Date and slots are required." });
  }

  try {
    const db = admin.firestore(); // Initialize Firestore
    const schedulesCollection = db.collection("scheduleCollection");

    // Log what we’re saving to Firestore
    console.log("Saving to Firestore with auto-generated ID");
    console.log("Data:", { date, slots });

    const docRef = await schedulesCollection.add({ date, slots });

    res.status(201).json({ 
      message: "Schedule created successfully.",
      scheduleId: docRef.id // return the auto-generated ID (optional)
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Server error while creating schedule." });
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const db = admin.firestore(); // Initialize Firestore
    const schedulesCollection = db.collection("scheduleCollection");

    const snapshot = await schedulesCollection.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: "No schedules found.", schedules: [] });
    }

    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Server error while fetching schedules." });
  }
};


module.exports = { createSchedule, getAllSchedules };
