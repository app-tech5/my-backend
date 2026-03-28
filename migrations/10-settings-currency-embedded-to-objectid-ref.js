const { ObjectId } = require("mongodb");

/**
 * Aligne la collection `settings` avec le modèle Mongoose Setting :
 * `currency` doit être un ObjectId référençant `currencies`, pas un sous-document.
 *
 * Pour chaque document dont `currency` est un objet (code/value/label/symbol),
 * on résout une devise dans `currencies` par `code` (priorité à `code`, sinon `value`).
 * Si aucune devise ne correspond, on insère une ligne dans `currencies` à partir du snapshot.
 */
function isObjectIdLike(c) {
  return c instanceof ObjectId;
}

function isEmbeddedCurrency(c) {
  if (c == null || typeof c !== "object") return false;
  if (isObjectIdLike(c)) return false;
  return "code" in c || "value" in c || "label" in c || "symbol" in c;
}

function resolveCode(embedded) {
  const raw = embedded.code ?? embedded.value ?? "";
  return String(raw).trim().toUpperCase();
}

module.exports = {
  up: async (db) => {
    const settingsCol = db.collection("settings");
    const currenciesCol = db.collection("currencies");

    const docs = await settingsCol.find({}).toArray();

    for (const doc of docs) {
      if (!isEmbeddedCurrency(doc.currency)) {
        continue;
      }

      const emb = doc.currency;
      const code = resolveCode(emb);
      if (!code) {
        throw new Error(
          `settings document ${doc._id}: embedded currency has no code/value`
        );
      }

      let currencyDoc = await currenciesCol.findOne({ code });
      if (!currencyDoc) {
        currencyDoc = await currenciesCol.findOne({
          code: { $regex: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
      }

      if (!currencyDoc) {
        const now = new Date();
        const { insertedId } = await currenciesCol.insertOne({
          code,
          exchangeRate:
            typeof emb.exchangeRate === "number" ? emb.exchangeRate : 0,
          name: emb.name || emb.label || code,
          symbol: emb.symbol != null ? String(emb.symbol) : "",
          createdAt: now,
          updatedAt: now,
        });
        currencyDoc = await currenciesCol.findOne({ _id: insertedId });
      }

      await settingsCol.updateOne(
        { _id: doc._id },
        { $set: { currency: currencyDoc._id } }
      );
    }
  },

  down: async (db) => {
    const settingsCol = db.collection("settings");
    const currenciesCol = db.collection("currencies");

    const docs = await settingsCol.find({}).toArray();

    for (const doc of docs) {
      const c = doc.currency;
      if (!isObjectIdLike(c)) {
        continue;
      }

      const currencyDoc = await currenciesCol.findOne({ _id: c });
      if (!currencyDoc) {
        continue;
      }

      await settingsCol.updateOne(
        { _id: doc._id },
        {
          $set: {
            currency: {
              value: currencyDoc.code,
              label: currencyDoc.name,
              symbol: currencyDoc.symbol,
              code: currencyDoc.code,
            },
          },
        }
      );
    }
  },
};
