const admin = require("firebase-admin");
const { db } = require("../firebaseConfig.js");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateJWT");
const { FormatDateTime } = require("../utils/FormatDateTime.js");
const jwt = require("jsonwebtoken");

const registerPA = async (req, res) => {
  console.log("registerPA");
  const { email, password, name, phone } = req.body;

  console.log({ email, password, name, phone });
  try {
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

const loginPA = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userDoc.ref.update({ refreshToken });

    const visitsSnapshot = await db
      .collection("visitCollection")
      .where("createdBy", "==", user.email)
      .where("dateTime", ">=", admin.firestore.Timestamp.fromDate(new Date()))
      .get();
    const upcomingVisits = visitsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const formattedUpcomingVisits = upcomingVisits.map((visit) => {
      const date = visit.dateTime.toDate(); //Firestore Timestamp to JavaScript Date
      const cleanDateTime = FormatDateTime(date.toISOString());

      return {
        ...visit,
        dateTime: cleanDateTime,
      };
    });

    const payload = {
      userID: user.uid,
      email: user.email,
      upcomingVisits: formattedUpcomingVisits || [],
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    res.status(200).json(payload);
  } catch (error) {
    console.log("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

const logoutPA = async (req, res) => {
  const { email } = req.body;

  try {
    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0].ref;

    await userDoc.update({ refreshToken: "" });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  console.log("Refresh endpoint hit");
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded || !decoded.email) {
      return res.status(400).json({ error: "Invalid refresh token payload" });
    }

    const userSnapshot = await db
      .collection("userCollection")
      .where("email", "==", decoded.email)
      .where("refreshToken", "==", refreshToken)
      .get();

    if (userSnapshot.empty) {
      console.warn(
        "Attempted refresh with invalid/used/unmatched token for email:",
        decoded.email
      );

      return res.status(403).json({
        error: "Invalid or unauthorized refresh token. Please log in again.",
      });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await userDoc.ref.update({ refreshToken: newRefreshToken });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ error: "Refresh token expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid refresh token." });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { registerPA, loginPA, logoutPA, refreshAccessToken };
