const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Récupère le token depuis les cookies ou l'header Authorization
  let token = req.cookies.token;

  // Si pas de token dans les cookies, vérifier l'header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Enlever "Bearer " du début
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Accès refusé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie le token
    req.user = decoded; // Stocke les infos utilisateur dans `req.user`
    //console.log("decoded", new Date(decoded.exp*1000))
    next();
  } catch (error) {
    console.log("error", error)
    res.status(403).json({ message: "Token invalide" });
  }
};

module.exports = authMiddleware;
