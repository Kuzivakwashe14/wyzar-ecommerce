// In backend/middleware/auth.js

const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('x-auth-token');

  // 2. Check if no token
  if (!token) {
    // 401 = Unauthorized
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. If there is a token, verify it
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Add the user payload from the token to the request object
    req.user = decoded.user;
    next(); // Move on to the next function (the route handler)
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;