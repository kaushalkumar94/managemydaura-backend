const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: "PA" },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

function generateRefreshToken(user) {
  return jwt.sign(
    { email: user.email, uid: user.uid }, // include email and uid!
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
