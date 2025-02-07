const genericController = (Model) => {
    return {
        getAll: async (req, res) => {
            try {
                const items = await Model.find();
                res.json(items);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        getById: async (req, res) => {
            try {
                const item = await Model.findById(req.params.id);
                if (!item) return res.status(404).json({ message: "Not Found" });
                res.json(item);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        create: async (req, res) => {
            try {
                const newItem = new Model(req.body);
                await newItem.save();
                res.status(201).json(newItem);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        },

        update: async (req, res) => {
            try {
                const updatedItem = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) return res.status(404).json({ message: "Not Found" });
                res.json(updatedItem);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        delete: async (req, res) => {
            try {
                const deletedItem = await Model.findByIdAndDelete(req.params.id);
                if (!deletedItem) return res.status(404).json({ message: "Not Found" });
                res.json({ message: "Deleted successfully" });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    };
};

module.exports = genericController;
