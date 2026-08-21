class BaseController {
  constructor(model) {
    this.model = model;
  }
  async getAll(req) {
    return await this.model.find();
  }
  async getById(req) {
    return await this.model.findById(req.params.id);
  }
  async create(req) {
    return await this.model.create(req.body);
  }
  async update(req) {
    return await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  }
  async delete(req) {
    return await this.model.findByIdAndDelete(req.params.id);
  }
}
module.exports = BaseController;
