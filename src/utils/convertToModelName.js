const convertToModelName = (collectionName) => {
    let modelName = collectionName;
    if (collectionName.endsWith("ies")) {
      modelName = collectionName.slice(0, -3) + "y"; // currencies -> Currency
    }else if (collectionName.endsWith("s")) {
      modelName = collectionName.slice(0, -1); // users -> User
    }
    return modelName.charAt(0).toUpperCase() + modelName.slice(1); // Première lettre en majuscule
  };
  

module.exports = convertToModelName;

// console.log(convertToModelName("settings"));