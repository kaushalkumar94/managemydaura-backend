const admin = require("firebase-admin");
const { db } = require("../firebaseConfig.js");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateJWT");
const { FormatDateTime } = require("../utils/FormatDateTime.js");
const jwt = require("jsonwebtoken");
// Register PA
const registerPA = async (req, res) => {
  console.log("registerPA");
  const { email, password, name, phone } = req.body;

  console.log({ email, password, name, phone });
  try {
    // Check if user already exists
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data in Firestore
    await db.collection("userCollection").add({
      name,
      email,
      password: hashedPassword,
      phone,
      refreshToken: "",
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login PA
const loginPA = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: "User not found" });
    }

    // Get user data (assuming email is unique)
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refreshToken to database
    await userDoc.ref.update({ refreshToken });

    // Get upcoming visits
    const visitsSnapshot = await db
      .collection("visitCollection")
      .where("createdBy", "==", user.email)
      .where("dateTime", ">=", admin.firestore.Timestamp.fromDate(new Date())) // Ensure comparison works
      .get();
    const upcomingVisits = visitsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Process upcoming visits
    const formattedUpcomingVisits = upcomingVisits.map((visit) => {
      const date = visit.dateTime.toDate(); // Convert Firestore Timestamp to JavaScript Date
      const cleanDateTime = FormatDateTime(date.toISOString());

      return {
        ...visit,
        dateTime: cleanDateTime,
      };
    });

    // Prepare payload
    const payload = {
      userID: user.uid,
      email: user.email,
      upcomingVisits: formattedUpcomingVisits || [],
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    // send response
    res.status(200).json(payload);
  } catch (error) {
    console.log("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Logout PA
const logoutPA = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: "User not found" });
    }

    // Get user document reference
    const userDoc = userSnapshot.docs[0].ref;

    // Clear the refreshToken
    await userDoc.update({ refreshToken: "" });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// grant new access token
const refreshAccessToken = async (req, res) => {
  console.log("Refresh endpoint hit");
  const { refreshToken } = req.body;

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded.email) {
      return res.status(400).json({ error: "Invalid refresh token payload" });
    }

    // Check if the refresh token exists in the database
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", decoded.email)
      .where("refreshToken", "==", refreshToken)
      .get();

    if (userSnapshot.empty) {
      console.warn('Attempted refresh with invalid/used/unmatched token for email:', decoded.email);
      return res
        .status(403)
        .json({ error: "Invalid or unauthorized refresh token. Please log in again." });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    await userDoc.ref.update({ refreshToken: "" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await userDoc.ref.update({ refreshToken: newRefreshToken }); // <-- Save NEW REFRESH TOKEN

    // 6. Send BOTH new tokens back to the client
    res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken // <-- Send the NEW REFRESH TOKEN back
    });
  } catch (error) {
    console.error("Error refreshing token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Refresh token expired" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { registerPA, loginPA, logoutPA, refreshAccessToken };
