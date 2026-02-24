async function populateSelectFields(data) {
  for (const key in data) {
    if (
      data[key] &&
      typeof data[key] === "object" &&
      data[key].value &&
      data[key].label
    ) {
      try {
        const model = require(`../models/${key.charAt(0).toUpperCase() + key.slice(1)}`);
        const foundDoc = await model.findById(data[key].value);
        if (foundDoc) {
          data[key] = foundDoc;
        } else {
          throw new Error(`Invalid ID for ${key}`);
        }
      } catch (error) {
        throw new Error(`Error processing field ${key}: ${error.message}`);
      }
    }
  }
}
module.exports = { populateSelectFields };
