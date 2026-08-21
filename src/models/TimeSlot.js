const mongoose = require('mongoose');
const addPopulateMiddleware = require('../utils/addPopulateMiddleware');
const TimeSlotSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  restaurants: { type: Object, default: { value: "", label: "" } },
  day_of_week: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
    default: 'monday'
  },
  start_time: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,
    default: '09:00'
  },
  end_time: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/,
    default: '17:00'
  },
  max_orders: {
    type: Number,
    default: 20,
    min: 1
  },
  is_active: {
    type: Boolean,
    default: true
  },
  slot_type: {
    type: String,
    enum: ['delivery', 'pickup', 'both'],
    default: 'delivery'
  }
}, { timestamps: true });
addPopulateMiddleware(TimeSlotSchema, [
{ path: "restaurant", select: "name" }]
);
module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
