const getDefaultValue = require("../utils/getDefaultValue");
const loadModels = require("../utils/loadModels");
const populateFields = require("../utils/populateFields");
loadModels();

const genericController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        // console.log(req.query)
        console.log("Requête reçue avec query params:");
        const items = await Model.find().setOptions({ queryParams: req.query });
        console.log("Résultat de la requête:", items);
        res.json(items);
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
      }
    },

    getById: async (req, res) => {
      // console.log("populateFields(Model)", populateFields(Model))
      try {
        const item = await Model.findById(req.params.id);
        // .populate(populateFields(Model))
        // console.log(item);
        // if (!item) return res.status(404).json({ message: "Not Found" });
        res.json(item);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
      }
    },

    create: async (req, res) => {
      try {
        if (req.body.isDefault) {
          await Model.updateMany({}, { isDefault: false });
        }
        const newItem = new Model(req.body);
        await newItem.save();
        res.status(201).json(newItem);
      } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
      }
    },

    update: async (req, res) => {
      try {
        if (req.body.isDefault) {
          await Model.updateMany(
            { _id: { $ne: req.params.id } },
            { isDefault: false }
          );
        }
        const updatedItem = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        if (!updatedItem) return res.status(404).json({ message: "Not Found" });
        console.log(updatedItem, req.params.id);
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

    getDefaultFields: async (req, res) => {
      try {
        const doc = await Model.findOne(
          {},
          { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
        );

        // console.log(doc);

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
      
            // Vérifier si c'est un tableau d'objets
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
