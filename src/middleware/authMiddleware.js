const jwt = require("jsonwebtoken");
const i18n = require('../config/i18n');
const authMiddleware = (req, res, next) => {
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); 
    }
  }
  if (!token) {
    return res.status(401).json({ message: i18n.__("access_denied_missing_token") });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; 
    next();
  } catch (error) {
    res.status(403).json({ message: i18n.__("invalid_token") });
  }
};
module.exports = authMiddleware;
