const jwt = require('jsonwebtoken');

// JWT secret and expiry time
const JWT_SECRET = "managemydaurasecret";
const ACCESS_TOKEN_EXPIRY = "1h";

// JWT refresh secret and expiry time
const JWT_REFRESH_SECRET = "managemydaurarefreshsecret";
const REFRESH_TOKEN_EXPIRY = "1d";

const generateAccessToken = (user) => {

  return jwt.sign({ uid: user.uid, email: user.email, role: 'PA' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (user) => {

  return jwt.sign({ uid: user.uid }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
