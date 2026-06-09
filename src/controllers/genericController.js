const getDefaultValue = require("../utils/getDefaultValue");
const loadModels = require("../utils/loadModels");
const populateFields = require("../utils/populateFields");
const i18n = require('../config/i18n');
loadModels();
const genericController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        const items = await Model.find(
          {
            role: { $ne: 'admin' }
          }
        ).setOptions({ queryParams: req.query, role: req.user?.type, authUser: req.user });
        res.json(items);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getById: async (req, res) => {
      try {
        const item = await Model.findById(req.params.id).setOptions({
          role: req.user?.type,
          authUser: req.user,
        });
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getByUserId: async (req, res) => {
      try {
        const query = Model.find({
          $or: [{ user: req.user.id }, { userId: req.user.id }],
        });
        const item = await query;

        if (Model.modelName === 'Transaction') {
          return res.json({
            transactions: item,
            balance: query._walletBalance ?? 0,
          });
        }

        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    create: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        const newItem = await Model.create(req.body);
        res.status(201).json(newItem);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    update: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        if (Model.modelName === 'Order') {
          const allowedStatusUpdates = {
            'pending': ['cancelled'],
          };
          const currentOrder = await Model.findById(req.params.id);
          if (!currentOrder) {
            return res.status(404).json({ message: i18n.__("order_not_found") });
          }
          // if (currentOrder.user.toString() !== req.user.id) {
          //   return res.status(403).json({ message: i18n.__("you_can_only_modify_your_own_orders") });
          // }
          // if (req.body.status && req.body.status !== currentOrder.status) {
          //   const currentStatus = currentOrder.status;
          //   const newStatus = req.body.status;
          //   if (allowedStatusUpdates[currentStatus] && !allowedStatusUpdates[currentStatus].includes(newStatus)) {
          //     return res.status(400).json({
          //       message: `Cannot change order status from ${currentStatus} to ${newStatus}`
          //     });
          //   }
          // }
        }
        const updatedItem = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        ).setOptions({ role: req.user?.type, authUser: req.user });

        if (!updatedItem) return res.status(404).json({ message: i18n.__("not_found") });
        res.json(updatedItem);
      } catch (error) {
        console.error(`❌ ${Model.modelName} update error:`, error);
        res.status(500).json({ error: error.message });
      }
    },
    delete: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        const deletedItem = await Model.findByIdAndDelete(req.params.id).setOptions({
          role: req.user?.type,
          authUser: req.user,
        });
        if (!deletedItem) return res.status(404).json({ message: i18n.__("not_found") });
        res.json({ message: i18n.__("deleted_successfully") });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
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
        console.error(i18n.__("error_fetching_default_fields"), error);
        res.status(500).json({ error: i18n.__("internal_server_error") });
      }
    },
    getSchema: async (req, res) => {
      try {
        const schema = Model.schema;
        const simplifiedSchema = {};
        Object.keys(schema.tree).forEach((path) => {
          if (["_id", "__v", "createdAt", "updatedAt"].includes(path)) return;
          const schemaType = schema.paths[path];
          if (!schemaType) return;
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
