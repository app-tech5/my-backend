const addPopulateMiddleware = (schema, paths) => {
  const populatePaths = paths.map(({ path, select }) => ({
    path,
    select
  }));
  schema.pre("findOne", function () {
    this.populate(populatePaths);
  });
  schema.pre("find", function () {
    this.populate(populatePaths);
  });
};
module.exports = addPopulateMiddleware;
