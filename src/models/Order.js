const mongoose = require("mongoose");
const autopopulate = require('mongoose-autopopulate');
const Driver = require("./Driver");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
        autopopulate: {
            select: "name phone image address"
        }
     },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true,
        autopopulate: {
            select: "name phone image address"
        }
     },
     driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, 
    //   autopopulate: {
    //     select: "name phone image address"
    // }
     }, 
    items: [
            {
                type: { type: String, required: true },
                item: {type: mongoose.Schema.Types.ObjectId, required: true, refPath: "items.type"},
                name:{ type: String, required: true },
                image: { type: String, required: true },
                price: { type: String, required: true },
                currency: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true },
                extras: [
                    {
                      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                      name: { type: String, required: true },
                      price: { type: Number, required: true },
                      quantity: { type: Number, required: true } 
                    }
                  ],
                variants: [
                  {
                    name: { type: String, required: true },
                    price: { type: Number, required: true },
                    extra: { type: Number, required: true },
                    size: { type: String, required: true },
                  }
                ],
                total: { type: Number, required: true } 
            },
        
                
            
    // {
    //     type: { type: String, 
    //         enum: ["Menu", "product"], 
    //         required: true },
    //     itemId: { 
    //       type: mongoose.Schema.Types.ObjectId, 
    //       required: true, 
    //       refPath: "items.type",
    //     //   autopopulate: { maxDepth: 1 } 
    //     },
    //     // name: { type: String, required: true },
        // quantity: { type: Number, required: true, min: 1 },
        // price: { type: Number, required: true }
    //   }

    ],
    totalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    tax: {
      rate: { type: Number, required: true },
      amount: { type: Number },
    },
    status: { 
      type: String, 
      enum: ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"], 
      default: "pending" 
    },
    payment: {
      method: { type: String, enum: ["credit_card", "mobile_money", "cash"], required: true },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      transactionId: { type: String }
    },
    delivery: {
      type: {
        type: String,
        enum: ["delivery", "pickup"],
        required: true
      },
      address: { type: String },
      estimatedTime: { type: Date },
      deliveryFee: { type: Number },
    //   riderId: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", default: null }
    }
  },
  { timestamps: true }
);

orderSchema.plugin(autopopulate);


orderSchema.pre("findOne", function () {
    this.populate({
        path: "items.item",
        select: "name image price"
    }).populate({
      path: "driver",
      select: "userId vehicle", // Sélectionne les champs du modèle Driver
      populate: {
          path: "userId",
          model: "User",
          select: "name phone image" // Sélectionne les champs du modèle User
      }
  });
});

orderSchema.post('findOne', function (order) {
    console.log('🟢 Hook post(findOne) exécuté !');
    if (!order) {
        console.log('⚠️ Aucun document trouvé.');
        return;
    }

    // console.log('📄 Document Order trouvé :', order);


    // Si le driver existe, réorganisez ses champs imbriqués
  //   if (order.driver && order.driver.userId) {
  //     // Déplacez les champs de userId directement dans driver
  //     // order.driver.userId = order.driver.userId._id; // Remplace l'objet userId par son ID
  //     // order.driver.userName = order.driver.userId.name; // Ajoute le nom de l'utilisateur
  //     // order.driver.userEmail = order.driver.userId.email; // Ajoute l'email de l'utilisateur
  //     order.driver = {
  //       vehicle1 : order.driver.toObject().vehicle.type}
  //     // Supprimez l'objet userId imbriqué
  //     // delete order.driver.userId;
  //     console.log("driver", order.driver)
  // }
  // order.driver.vehicle = {}
  // order.driver.bonbon = 1
  // order.driver = order.driver.toObject();
  // order.driver = {}
  // Supprimez l'objet userId imbriqué
  // delete order.driver.userId;
  // console.log("driver", order.driver)



  

    // Vérifions si order.items est bien un tableau
    if (!Array.isArray(order.items)) {
        console.log('❌ order.items n\'est pas un tableau !', order.items);
        return;
    }

    console.log(`📌 Nombre d'items : ${order.items.length}`);

    order.items = order.items.map(item => {
        // console.log('🔍 Traitement de l\'item:', item);

        const itemId = item.item?._id || item.item; // Récupère l'ID d'origine

        const extrasWithoutId = item.toObject().extras.map(extra => {
          const { _id, ...rest } = extra; // On extrait `_id` et on garde le reste
          // console.log(rest)
          return rest; // On retourne l'objet sans `_id`
        });

        // console.log(item.toObject().extras.map(({ productId, ...rest }) => rest))

        const updatedItem = {
            // ...item.toObject(), 
            // item: itemId, // Remet l'ID dans `item`
            name: item.item?.name || "",
            image: item.item?.image || "",
            // description: item.item?.description || "",
            price: (item.item?.price) || 0,
            quantity: item.quantity,
            extras: item.toObject().extras.map(({ productId, ...rest }) => rest),
            variants: item.variants,
            total: item.quantity * item.item?.price + item.extras.reduce((a, v)=> a+v.price*v.quantity,0)
            // currency: item.item?.currency || ""
        };

        // console.log('✅ Item mis à jour :', updatedItem);
        return updatedItem;
    });
    order.subtotal = order.items.reduce((a,v) => a + v.total, 0);
    order.tax.amount = order.tax.rate * order.subtotal;
    order.totalPrice = order.items.reduce((a,v) => a + v.total, 0) + order.delivery.deliveryFee + order.tax.amount;
    console.log('✅ Order final mis à jour:', order.tax.amount);
    // console.log(order.items);
});


orderSchema.pre('findOneAndUpdate', async function (next) {
  this.previousOrder = await this.model.findOne(this.getQuery()); // Récupère l'ancien document
  if (this.previousOrder?.status !== "delivered")
  next();
});

// orderSchema.pre('findOneAndUpdate', async function (next) {
//   // Récupérer l'ancienne commande avant mise à jour
//   const previousOrder = await this.model.findOne(this.getQuery());
  
//   // Vérifier si le statut de la commande passe de non-livrée à livrée
//   if (previousOrder.status !== "delivered" && this._update.status === "delivered") {
//       // Mettre à jour le totalDeliveries du conducteur
//       await Driver.findByIdAndUpdate(this._update.driverId, { $inc: { totalDeliveries: 1 } });
//   }
  
//   next();
// });



orderSchema.post('findOneAndUpdate', async function (doc) {
  if (doc?.status === "delivered" && this.previousOrder.status !== "delivered") {
    console.log("111111111111", this.previousOrder.status)
      if (this.previousOrder.status !== "delivered") {
          await Driver.findByIdAndUpdate(doc.driver, { $inc: { totalDeliveries: 1 } });
      }
  }
});



// Middleware pour autopopulate uniquement itemId
// orderSchema.pre(/^find/, function (next) {
//     console.log("⚡ Hook pre('find') exécuté !");
//     console.log("🔍 Query actuelle :", this.getQuery());
  
//     // Vérifier si Mongoose applique bien le populate
//     this.populate({
//       path: "items.item",
//       select: "name description price currency",
//     });
  
//     console.log("📌 Populate appliqué :", this.mongooseOptions().populate);
  
//     next();
//   });
  
  
module.exports = mongoose.model("Order", orderSchema);
