class BaseController {
    constructor(Model) {
      this.Model = Model;
    }
  
    async getAll(req, res) {
      try {
        const items = await this.Model.findAll();
        res.json(items);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }

    async getById (req, res) {
        try {
            const item = await this.Model.findById(req.params.id);
            // if (!item) return res.status(404).json({ message: "Not Found" });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create (req, res) {
        try {
            if (req.body.isDefault) {
                await this.Model.updateMany({}, { isDefault: false });
            }
            const newItem = new Model(req.body);
            await newItem.save();
            res.status(201).json(newItem);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    update = async (req, res) => {
        try {
            if (req.body.isDefault) {
                await this.Model.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
            }
            const updatedItem = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedItem) return res.status(404).json({ message: "Not Found" });
            console.log(updatedItem, req.params.id)
            res.json(updatedItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    delete = async (req, res) => {
        try {
            const deletedItem = await this.Model.findByIdAndDelete(req.params.id);
            if (!deletedItem) return res.status(404).json({ message: "Not Found" });
            res.json({ message: "Deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
  
    // Implémentez les autres méthodes CRUD ici...
  }
  
  
  
//   const userController = new UserController();
  
//   router.get("/users", (req, res) => userController.getAll(req, res));
  // Ajoutez les autres routes spécifiques à User ici...