const { db } = require('../firebaseConfig.js');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateJWT');

// Register PA
const registerPA = async (req, res) => {
  console.log('registerPA');
  const { email, password, name, phone } = req.body;

  console.log({ email, password, name, phone });
  try {
    // Check if user already exists
    const userSnapshot = await db.collection('userCollection')
      .where('email', '==', email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data in Firestore
    await db.collection('userCollection').add({
      name,
      email,
      password: hashedPassword,
      phone,
      refreshToken: ''
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login PA
const loginPA = async (req, res) => {
  const { email, password } = req.body;
  try {

    // Find user by email
    const userSnapshot = await db.collection('userCollection')
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Get user data (assuming email is unique)
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    console.log('User found:', user);

    // Generate JWT
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Get upcoming visits
    const visitsSnapshot = await db.collection('visitCollection').where('createdBy', '==', user.email).where('dateTime', '>=', new Date()).get();
    const upcomingVisits = visitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Visits:", visitsSnapshot.docs.length);
    console.log('Upcoming visits:', upcomingVisits.length);
    

    // Prepare payload
    const payload = {
      userID: user.uid,
      email: user.email,
      upcomingVisits: upcomingVisits ? upcomingVisits : [],
      accessToken: accessToken,
      refreshToken: refreshToken
    }

    // send response
    res.status(200).json(payload);

  } catch (error) {
    console.log('Error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { registerPA, loginPA };
