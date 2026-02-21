const getDefaultValue = require("../utils/getDefaultValue");
const loadModels = require("../utils/loadModels");
const populateFields = require("../utils/populateFields");
loadModels();
const genericController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        let query = {};
        if (Model.modelName === 'Order') {
          if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
          }
          query.user = req.user.id;
        }
        const items = await Model.find(query).setOptions({ queryParams: req.query });
        res.json(items);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getById: async (req, res) => {
      try {
        const item = await Model.findById(req.params.id);
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    create: async (req, res) => {
    },
    update: async (req, res) => {
      try {
        if (Model.modelName === 'Order') {
          const allowedStatusUpdates = {
            'pending': ['cancelled'], 
          };
          const currentOrder = await Model.findById(req.params.id);
          if (!currentOrder) {
            return res.status(404).json({ message: "Order not found" });
          }
          if (currentOrder.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only modify your own orders" });
          }
          if (req.body.status && req.body.status !== currentOrder.status) {
            const currentStatus = currentOrder.status;
            const newStatus = req.body.status;
            if (allowedStatusUpdates[currentStatus] && !allowedStatusUpdates[currentStatus].includes(newStatus)) {
              return res.status(400).json({
                message: `Cannot change order status from ${currentStatus} to ${newStatus}`
              });
            }
          }
        }
        const updatedItem = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        if (!updatedItem) return res.status(404).json({ message: "Not Found" });
        res.json(updatedItem);
      } catch (error) {
        console.error(`❌ ${Model.modelName} update error:`, error);
        res.status(500).json({ error: error.message });
      }
    },
    delete: async (req, res) => {
    },
    getDefaultFields: async (req, res) => {
      try {
        const doc = await Model.findOne(
          {},
          { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
        );
        if (!doc) return res.json({});
        const defaultFields = Object.fromEntries(
          Object.entries(doc.toObject()).map(([key, value]) => [
            key,
            getDefaultValue(value, key),
          ])
        );
        res.json(defaultFields);
      } catch (error) {
        console.error("Error fetching default fields:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
    getSchema: async (req, res) => {
        try {
          const schema = Model.schema;
          const simplifiedSchema = {};
          Object.entries(schema.paths).forEach(([path, schemaType]) => {
            if (["_id", "__v", "createdAt", "updatedAt"].includes(path)) return;
            if (schemaType.schema) {
              const subSchema = {};
              Object.entries(schemaType.schema.paths).forEach(([subPath, subType]) => {
                subSchema[subPath] = subType.defaultValue;
              });
              simplifiedSchema[path] = [subSchema];
            } else {
              simplifiedSchema[path] = schemaType.defaultValue;
            }
          });
          res.json(simplifiedSchema);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }
      ,
  };
};
module.exports = genericController;
