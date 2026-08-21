function populateFields(Model) {
  return Object.keys(Model.schema.paths).filter((key) => {
    return (
      Model.schema.paths[key].instance === "ObjectId" &&
      Model.schema.paths[key].options.ref);

  });
}
module.exports = populateFields;
