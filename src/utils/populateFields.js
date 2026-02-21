function populateFields(Model) {
  console.log("Model.schema.paths", Object.keys(Model.schema.paths));
  return Object.keys(Model.schema.paths).filter((key) => {
    console.log(Model.schema.paths[key].instance, Model.schema.paths[key].options.ref);
    return (
      Model.schema.paths[key].instance === "ObjectId" &&
      Model.schema.paths[key].options.ref
    );
  });
}
module.exports = populateFields;
