const pluralize = require("pluralize");

const convertToModelName = (collectionName) => {
  if (!collectionName || typeof collectionName !== "string") {
    throw new Error("Invalid collection name");
  }
  
  if (collectionName === 'deliverysettings') {
    return 'DeliverySetting';
  }

  return (
    pluralize.singular(collectionName).charAt(0).toUpperCase() +
    pluralize.singular(collectionName).slice(1)
  );
};

module.exports = convertToModelName;

