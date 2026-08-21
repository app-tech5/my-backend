const mongoose = require('mongoose');
const { Schema } = mongoose;

const restaurantPaymentSettingSchema = new Schema(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    cashPayment: { type: Boolean, default: true },
    cardPayment: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: false },
    minimumOrder: { type: Number, default: 10, min: 0 },
    fixedFee: { type: Number, default: 0.3, min: 0 },
    percentageFee: { type: Number, default: 2.9, min: 0, max: 100 }
  },
  { timestamps: true }
);

restaurantPaymentSettingSchema.index({ restaurant: 1 }, { unique: true });

restaurantPaymentSettingSchema.pre('find', function filterByRestaurantFromQuery(next) {
  const { queryParams } = this.options || {};
  if (queryParams?.type) {
    this.where({ restaurant: queryParams.type });
  }
  next();
});

const RestaurantPaymentSetting = mongoose.model(
  'RestaurantPaymentSetting',
  restaurantPaymentSettingSchema
);
module.exports = RestaurantPaymentSetting;
