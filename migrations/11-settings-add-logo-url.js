/**
 * Ajoute le champ `logoUrl` sur tous les documents `settings`.
 * Si un ancien champ `image_url` existe, sa valeur est recopiée puis `image_url` est supprimé.
 */
module.exports = {
  async up(db) {
    const col = db.collection("settings");
    const docs = await col.find({}).toArray();

    for (const doc of docs) {
      const patch = {};

      if (!Object.prototype.hasOwnProperty.call(doc, "logoUrl")) {
        const legacy =
          typeof doc.image_url === "string" && doc.image_url.trim() !== ""
            ? doc.image_url.trim()
            : "";
        patch.$set = { logoUrl: legacy };
      }

      if (Object.prototype.hasOwnProperty.call(doc, "image_url")) {
        patch.$unset = { image_url: "" };
      }

      if (patch.$set || patch.$unset) {
        await col.updateOne({ _id: doc._id }, patch);
      }
    }
  },

  async down(db) {
    const col = db.collection("settings");
    const docs = await col.find({}).toArray();

    for (const doc of docs) {
      const logo =
        typeof doc.logoUrl === "string" && doc.logoUrl.trim() !== ""
          ? doc.logoUrl.trim()
          : "";
      await col.updateOne(
        { _id: doc._id },
        {
          ...(logo ? { $set: { image_url: logo } } : {}),
          $unset: { logoUrl: "" },
        }
      );
    }
  },
};
