const addPopulateMiddleware = (schema, paths) => {
    // itère sur chaque path et sa sélection pour construire les options de population
    const populatePaths = paths.map(({ path, select }) => ({
      path,
      select, // Utilise le select spécifié pour chaque path
    }));
  
    // Ajout du middleware pour 'findOne'
    schema.pre("findOne", function () {
      this.populate(populatePaths);
    });
  
    // Ajout du middleware pour 'find'
    schema.pre("find", function () {
      this.populate(populatePaths);
    });
  };
  
  // Exemple d'utilisation avec votre ProductSchema, où chaque path peut avoir son propre 'select'
//   addPopulateMiddleware(ProductSchema, [
//     { path: "restaurant", select: "name address" },
//     { path: "category", select: "name description" }
//   ]);
  
  
  module.exports = addPopulateMiddleware;
