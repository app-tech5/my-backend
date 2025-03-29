// migrations/XXXXXX-create-delivery-settings.js (remplacez XXXXXX par un timestamp)

module.exports = {
  async up(db, client) {
    const defaultDeliverySettings = {
      isDeliveryEnabled: true,
      deliveryPreparationTime: 30,
      maxDeliveryDistance: 15,
      
      deliveryFeeType: "FIXED",
      fixedDeliveryFee: 2.5,
      dynamicDeliveryFee: {
        baseFee: 1.5,
        perKmFee: 0.5,
        minFee: 1.5,
        maxFee: 10
      },
      freeDeliveryThreshold: 25,

      deliveryZones: [
        {
          name: "Centre-ville",
          polygonCoordinates: [
            [48.8566, 2.3522],
            [48.8575, 2.3530],
            [48.8580, 2.3498],
            [48.8568, 2.3482]
          ],
          fee: 2.0
        }
      ],
      
      deliveryHours: {
        start: "08:00",
        end: "23:00"
      },
      blackoutDays: [],
      
      allowScheduledDelivery: true,
      schedulingLeadTime: 2,
      timeSlotDuration: 30,
      
      driverAssignmentMethod: "AUTO",
      autoAssignmentRadius: 5,
      realTimeTracking: true,
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('deliverysettings').insertOne(defaultDeliverySettings);
  },

  async down(db, client) {
    await db.collection('deliverysettings').deleteOne({ 
      deliveryFeeType: "FIXED" 
    });
  }
};