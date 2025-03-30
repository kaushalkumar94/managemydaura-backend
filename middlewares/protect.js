const jwt = require('jsonwebtoken');

// Middleware to protect routes using JWT authentication
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and has a valid format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  // Check if token is empty or invalid
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Ensure the decoded token has the required data
    if (!decoded || !decoded.email || !decoded.userID) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Attach user data to the request object for further use
    req.user = decoded;

    // Proceed to the next middleware or controller
    next();
  } catch (error) {
    console.error('Token verification error:', error);

    // Provide specific error messages based on the error type

    // 498 error code is reserved for expired token warning.
    if (error.name === 'TokenExpiredError') {
      return res.status(498).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { protect };
