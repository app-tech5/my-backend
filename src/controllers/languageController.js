const BaseController = require("./BaseController");
const LanguageModel = require("../models/Language");
class LanguageController extends BaseController {
  constructor() {
    super(LanguageModel);
  }
  async create(req) {
    if (req.body.isDefault) {
      await this.model.updateMany({}, { isDefault: false });
    }
    return super.create(req);
  }
  async update(req) {
    if (req.body.isDefault) {
      await this.model.updateMany({}, { isDefault: false });
    }
    return super.update(req);
  }
}
module.exports = new LanguageController();
