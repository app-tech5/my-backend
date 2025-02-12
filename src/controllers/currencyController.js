const Currency = require("../models/Currency");

class CurrencyController extends BaseController {
    constructor() {
      super(Currency); // User est le modèle spécifique
    }
  
    // Vous pouvez ajouter des méthodes spécifiques à User ici...
  }