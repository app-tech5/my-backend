#!/usr/bin/env node
/**
 * Fix marketing demo data: restaurant food images, names, dedupe categories.
 */
const { MongoClient } = require("mongodb");

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop", // restaurant interior
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop", // dining
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop", // plated food
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop", // restaurant
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop", // outdoor cafe
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop", // bistro
  "https://images.unsplash.com/photo-1550963211-0af1746293a4?w=800&h=600&fit=crop", // kitchen
  "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=600&fit=crop", // people dining
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop", // bar restaurant
  "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop", // pasta place
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop&sat=-20",
  "https://images.unsplash.com/photo-1600891964599-f61ba0a2f8a9?w=800&h=600&fit=crop", // steak
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop", // pizza
  "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&h=600&fit=crop", // sushi
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop", // burger
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550963211-0af1746293a4?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=600&fit=crop&q=80",
];

const PRETTY_NAMES = [
  "Le Petit Bistrot",
  "Maison du Burger",
  "Sakura Sushi",
  "Trattoria Roma",
  "Green Bowl Kitchen",
  "Paris Pizza Co.",
  "The Smokehouse",
  "Café Lumière",
  "Ocean Catch",
  "Spice Route",
  "Brick Oven",
  "Harvest Table",
  "Night Owl Diner",
  "Bamboo Garden",
  "Crêpe & Co",
  "Alpine Fondue",
  "Taco Libre",
  "Golden Wok",
  "Provence Plate",
  "Urban Pasta",
  "Demo Kitchen",
  "Bercy Brasserie",
];

async function main() {
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017/good-foods");
  const db = client.db();

  const restos = await db.collection("restaurants").find({}).sort({ _id: 1 }).toArray();
  for (let i = 0; i < restos.length; i++) {
    const image = FOOD_IMAGES[i % FOOD_IMAGES.length];
    const name = PRETTY_NAMES[i % PRETTY_NAMES.length];
    await db.collection("restaurants").updateOne(
      { _id: restos[i]._id },
      {
        $set: {
          image,
          image_url: image,
          name,
          description:
            restos[i].description === "Test" || !restos[i].description
              ? `Fresh dishes and delivery from ${name}.`
              : restos[i].description,
        },
      }
    );
  }
  console.log(`Updated ${restos.length} restaurants with food images + names`);

  // Dedupe categories by name (keep first)
  const cats = await db.collection("categories").find({}).sort({ _id: 1 }).toArray();
  const seen = new Set();
  let removed = 0;
  for (const cat of cats) {
    const key = String(cat.name || "").toLowerCase();
    if (seen.has(key)) {
      await db.collection("categories").deleteOne({ _id: cat._id });
      removed++;
    } else {
      seen.add(key);
    }
  }
  console.log(`Removed ${removed} duplicate categories`);

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
