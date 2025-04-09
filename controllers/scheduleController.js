const { getDatabase, ref, set, push } = require("firebase-admin/database");

const createSchedule = async (req, res) => {
  const { date, slots } = req.body;
  console.log("Incoming Schedule:", req.body);

  if (!date || !Array.isArray(slots) || slots.length === 0) {
    console.log("Invalid payload received");
    return res.status(400).json({ message: "Date and slots are required." });
  }

  try {
    const db = getDatabase();
    const scheduleRef = ref(db, "schedules");

    // Store using date as a key (replace "/" to avoid path issues)
    const safeDateKey = date.replace(/\//g, "-");

    // Log what we’re saving to Firebase
    console.log("Saving to Firebase at key:", safeDateKey);
    console.log("Data:", { date, slots });

    await set(ref(db, `schedules/${safeDateKey}`), { date, slots });

    res.status(201).json({ message: "Schedule created successfully." });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Server error while creating schedule." });
  }
};

module.exports = { createSchedule };
