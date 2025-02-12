const pluralize = require("pluralize");

const convertToModelName = (collectionName) => {
  if (!collectionName || typeof collectionName !== "string") {
    throw new Error("Invalid collection name");
  }
  return (
    pluralize.singular(collectionName).charAt(0).toUpperCase() +
    pluralize.singular(collectionName).slice(1)
  );
};

// console.log(convertToModelName("currencies")); // Currency
// console.log(convertToModelName("users")); // User
// console.log(convertToModelName("children")); // Child
// console.log(convertToModelName("people")); // Person

// const convertToModelName = (collectionName) => {
//     let modelName = collectionName;
//     if (collectionName.endsWith("ies")) {
//       modelName = collectionName.slice(0, -3) + "y"; // currencies -> Currency
//     }else if (collectionName.endsWith("s")) {
//       modelName = collectionName.slice(0, -1); // users -> User
//     }
//     return modelName.charAt(0).toUpperCase() + modelName.slice(1); // Première lettre en majuscule
//   };

module.exports = convertToModelName;

// console.log(convertToModelName("settings"));
