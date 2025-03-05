async function populateSelectFields(data) {
    console.log("--------------", data)
  for (const key in data) {
    console.log(`Processing key: ${key}`, data[key]);
    if (
      data[key] &&
      typeof data[key] === "object" &&
      data[key].value &&
      data[key].label
    ) {
      try {
        console.log(`Fetching model for key: ${key}`);
        const model = require(`../models/${key.charAt(0).toUpperCase() + key.slice(1)}`);
        console.log(`Model loaded for key: ${key}, searching for ID: ${data[key].value}`);
        const foundDoc = await model.findById(data[key].value);
        if (foundDoc) {
          console.log(`Document found for key: ${key}`, foundDoc);
          data[key] = foundDoc; // Remplacer l'objet par le document trouvé
        } else {
          console.error(`Invalid ID for key: ${key}`);
          throw new Error(`Invalid ID for ${key}`);
        }
      } catch (error) {
        console.error(`Error processing field ${key}: ${error.message}`);
        throw new Error(`Error processing field ${key}: ${error.message}`);
      }
    }
  }
}

module.exports = { populateSelectFields };
