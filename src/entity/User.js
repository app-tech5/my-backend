const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
  name: "User",
  columns: {
    id: {
      type: "objectId",
      primary: true,
      generated: true
    },
    email: {
      type: "string",
      unique: true
    },
    password: {
      type: "string"
    },
    createdAt: {
      type: "date",
      createDate: true
    },
    updatedAt: {
      type: "date",
      updateDate: true
    }
  }
});
