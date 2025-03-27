// const pluralize = require("pluralize");

// function applyTransformHooks(schema, fields) {
//   function transformReferencedFields(doc) {
//     fields.forEach((field) => {
//       if (doc[field] && doc[field].value) {
//         const singularField = pluralize.singular(field);
//         doc[singularField] = doc[field].value;
//         doc[field] = { value: doc[field].value, label: doc[field].label };
//       }
//     });

//     doc.updatedAt = Date.now();
//   }

//   schema.pre("save", function (next) {
//     transformReferencedFields(this);
//     next();
//   });

//   schema.pre("findOneAndUpdate", function (next) {
//     const update = this.getUpdate();
//     if (update) {
//       transformReferencedFields(update);
//     }
//     next();
//   });
// }

// module.exports = applyTransformHooks;


const pluralize = require("pluralize");

function applyTransformHooks(schema, fields) {
  function transformReferencedFields(doc) {
    fields.forEach((field) => {
      if (Array.isArray(doc[field])) {
        // 🟢 Si c'est un tableau (ex: variants)
        doc[field].forEach((item, index) => {
          if (item.value) {
            doc[field][index] = { value: item.value, label: item.label };
          }
        });

        // On peut aussi stocker un tableau des IDs séparé, si besoin
        const singularField = pluralize.singular(field);
        doc[singularField + "Ids"] = doc[field].map((item) => item.value);
      } else if (doc[field] && doc[field].value) {
        // 🔵 Si c'est un champ unique
        const singularField = pluralize.singular(field);
        doc[singularField] = doc[field].value;
        doc[field] = { value: doc[field].value, label: doc[field].label };
      }
    });

    doc.updatedAt = Date.now();
  }

  schema.pre("save", function (next) {
    transformReferencedFields(this);
    next();
  });

  schema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update) {
      transformReferencedFields(update);
    }
    next();
  });
}

module.exports = applyTransformHooks;

