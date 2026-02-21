const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); 
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Accès refusé, token manquant" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; 
    next();
  } catch (error) {
    res.status(403).json({ message: "Token invalide" });
  }
};
module.exports = authMiddleware;
