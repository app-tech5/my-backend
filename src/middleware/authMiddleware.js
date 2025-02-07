const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // Récupère le token depuis les cookies

  if (!token) {
    return res.status(401).json({ message: "Accès refusé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie le token
    req.user = decoded; // Stocke les infos utilisateur dans `req.user`
    next();
  } catch (error) {
    res.status(403).json({ message: "Token invalide" });
  }
};

module.exports = authMiddleware;
