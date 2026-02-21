const mongoose = require('mongoose');
module.exports = {
  async up(db) {
    try {
      const existingCount = await db.collection('orders').countDocuments();
      if (existingCount === 0) {
        return;
      }
      const orders = await db.collection('orders').find({}).toArray();
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      monthStart.setHours(0, 0, 0, 0);
      const totalOrders = orders.length;
      const todayCount = Math.ceil(totalOrders * 0.2);
      const weekCount = Math.ceil(totalOrders * 0.3);
      const monthCount = totalOrders - todayCount - weekCount;
      let updatedCount = 0;
      for (let i = 0; i < todayCount && i < orders.length; i++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const randomSecond = Math.floor(Math.random() * 60);
        const newCreatedAt = new Date(todayStart);
        newCreatedAt.setHours(randomHour, randomMinute, randomSecond, 0);
        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) 
            }
          }
        );
        updatedCount++;
      }
      for (let i = todayCount; i < todayCount + weekCount && i < orders.length; i++) {
        const randomTime = weekStart.getTime() + Math.random() * (now.getTime() - weekStart.getTime());
        const newCreatedAt = new Date(randomTime);
        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) 
            }
          }
        );
        updatedCount++;
      }
      for (let i = todayCount + weekCount; i < orders.length; i++) {
        const randomTime = monthStart.getTime() + Math.random() * (weekStart.getTime() - monthStart.getTime());
        const newCreatedAt = new Date(randomTime);
        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) 
            }
          }
        );
        updatedCount++;
      }
      const todayCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: todayStart } });
      const weekCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: weekStart, $lt: todayStart } });
      const monthCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: monthStart, $lt: weekStart } });
    } catch (error) {
      throw error;
    }
  },
  async down(db) {
    try {
      const now = new Date();
      const result = await db.collection('orders').updateMany(
        {},
        {
          $set: {
            createdAt: now,
            updatedAt: now
          }
        }
      );
    } catch (error) {
      throw error;
    }
  }
};
