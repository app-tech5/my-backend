const getDefaultValue = require("../utils/getDefaultValue");
const loadModels = require("../utils/loadModels");
const populateFields = require("../utils/populateFields");
const i18n = require('../config/i18n');
loadModels();
const genericController = (Model) => {
  return {
    getAll: async (req, res) => {
      try {
        const items = await Model.find(
          {
            role: { $ne: 'admin' }
          }
        ).setOptions({ queryParams: req.query, role: req.user?.type, authUser: req.user });
        res.json(items);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getById: async (req, res) => {
      try {
        const item = await Model.findById(req.params.id).setOptions({
          role: req.user?.type,
          authUser: req.user,
        });
        if (!item) {
          return res.status(404).json({ message: i18n.__("not_found") });
        }
        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getByUserId: async (req, res) => {
      try {
        const query = Model.find({
          $or: [{ user: req.user.id }, { userId: req.user.id }],
        });
        const item = await query;

        if (Model.modelName === 'Transaction') {
          return res.json({
            transactions: item,
            balance: query._walletBalance ?? 0,
          });
        }

        res.json(item);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    create: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        const payload = { ...req.body };
        if (req.user?.id) {
          if (Model.schema?.paths?.createdBy && !payload.createdBy) {
            payload.createdBy = req.user.id;
          }
          if (Model.schema?.paths?.created_by && !payload.created_by) {
            payload.created_by = req.user.id;
          }
        }

        if (Model.modelName === 'PaymentMethod') {
          const {
            assertPaymentMethodAllowed,
          } = require('../services/paymentEligibilityService');
          await assertPaymentMethodAllowed(payload.methodType);
        }

        if (Model.modelName === 'Order') {
          const {
            assertPaymentMethodAllowed,
          } = require('../services/paymentEligibilityService');
          const { priceOrderForCustomer } = require('../services/orderPricingService');

          await assertPaymentMethodAllowed(payload.payment?.method);

          const items = Array.isArray(payload.items) ? payload.items : [];
          const itemsSubtotal = items.reduce((sum, it) => {
            const line =
              Number(it.total) ||
              Number(it.price || 0) * Number(it.quantity || 1);
            return sum + line;
          }, 0);
          const baseSubtotal =
            itemsSubtotal > 0 ? itemsSubtotal : Number(payload.subtotal) || 0;
          const taxRate =
            payload.tax?.rate != null
              ? Number(payload.tax.rate)
              : 0;
          const priced = await priceOrderForCustomer({
            userId: payload.user || req.user?.id,
            subtotal: baseSubtotal,
            deliveryFee: Number(payload.delivery?.deliveryFee || 0),
            taxRate,
          });
          payload.subtotal = priced.subtotal;
          payload.tax = {
            ...(payload.tax || {}),
            rate: priced.taxRate,
            amount: priced.taxAmount,
          };
          payload.totalPrice = priced.totalPrice;
          payload.delivery = {
            ...(payload.delivery || {}),
            deliveryFee: priced.deliveryFee,
          };
          if (priced.discountAmount > 0 || priced.memberFreeDelivery) {
            payload.channelMeta = {
              ...(payload.channelMeta || {}),
              membership: {
                discountPercent: priced.discountPercent,
                discountAmount: priced.discountAmount,
                freeDelivery: priced.memberFreeDelivery,
                planName: priced.benefits?.planName,
              },
            };
          }
        }

        if (Model.modelName === 'AppSetting') {
          const {
            syncGatewayFlagsFromAppSettings,
          } = require('../services/paymentEligibilityService');
          await syncGatewayFlagsFromAppSettings(payload);
        }

        if (Model.modelName === 'Gateway') {
          const AppSetting = require('../models/AppSetting');
          const id = String(payload.identifier || '').toLowerCase();
          if (id === 'stripe' && typeof payload.active === 'boolean') {
            await AppSetting.updateOne({}, { $set: { stripeEnabled: !!payload.active } });
          }
          if (
            (id === 'cash-on-delivery' || id === 'cash_on_delivery') &&
            typeof payload.active === 'boolean'
          ) {
            await AppSetting.updateOne(
              {},
              { $set: { cashOnDeliveryEnabled: !!payload.active } }
            );
          }
        }

        const newItem = await Model.create(payload);
        res.status(201).json(newItem);
      } catch (error) {
        const status = error.status || 500;
        res.status(status).json({ error: error.message, message: error.message });
      }
    },
    update: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        if (Model.modelName === 'Order') {
          const allowedStatusUpdates = {
            'pending': ['cancelled'],
          };
          const currentOrder = await Model.findById(req.params.id);
          if (!currentOrder) {
            return res.status(404).json({ message: i18n.__("order_not_found") });
          }
          // if (currentOrder.user.toString() !== req.user.id) {
          //   return res.status(403).json({ message: i18n.__("you_can_only_modify_your_own_orders") });
          // }
          // if (req.body.status && req.body.status !== currentOrder.status) {
          //   const currentStatus = currentOrder.status;
          //   const newStatus = req.body.status;
          //   if (allowedStatusUpdates[currentStatus] && !allowedStatusUpdates[currentStatus].includes(newStatus)) {
          //     return res.status(400).json({
          //       message: `Cannot change order status from ${currentStatus} to ${newStatus}`
          //     });
          //   }
          // }
        }
        if (Model.modelName === 'AppSetting') {
          const {
            syncGatewayFlagsFromAppSettings,
          } = require('../services/paymentEligibilityService');
          await syncGatewayFlagsFromAppSettings(req.body);
        }

        if (Model.modelName === 'Gateway') {
          const AppSetting = require('../models/AppSetting');
          const current = await Model.findById(req.params.id).select('identifier');
          const id = String(current?.identifier || req.body.identifier || '').toLowerCase();
          if (id === 'stripe' && typeof req.body.active === 'boolean') {
            await AppSetting.updateOne({}, { $set: { stripeEnabled: !!req.body.active } });
          }
          if (
            (id === 'cash-on-delivery' || id === 'cash_on_delivery') &&
            typeof req.body.active === 'boolean'
          ) {
            await AppSetting.updateOne(
              {},
              { $set: { cashOnDeliveryEnabled: !!req.body.active } }
            );
          }
        }

        const updatedItem = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        ).setOptions({ role: req.user?.type, authUser: req.user });

        if (!updatedItem) return res.status(404).json({ message: i18n.__("not_found") });
        res.json(updatedItem);
      } catch (error) {
        console.error(`❌ ${Model.modelName} update error:`, error);
        res.status(500).json({ error: error.message });
      }
    },
    delete: async (req, res) => {
      try {
        if (req.user?.isDemo) return res.status(403).json({ message: i18n.__("demo_mode_action_not_available") });
        const deletedItem = await Model.findByIdAndDelete(req.params.id).setOptions({
          role: req.user?.type,
          authUser: req.user,
        });
        if (!deletedItem) return res.status(404).json({ message: i18n.__("not_found") });
        res.json({ message: i18n.__("deleted_successfully") });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    getDefaultFields: async (req, res) => {
      try {
        const doc = await Model.findOne(
          {},
          { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
        );
        if (!doc) return res.json({});
        const defaultFields = Object.fromEntries(
          Object.entries(doc.toObject()).map(([key, value]) => [
            key,
            getDefaultValue(value, key),
          ])
        );
        res.json(defaultFields);
      } catch (error) {
        console.error(i18n.__("error_fetching_default_fields"), error);
        res.status(500).json({ error: i18n.__("internal_server_error") });
      }
    },
    getSchema: async (req, res) => {
      try {
        const schema = Model.schema;
        const simplifiedSchema = {};
        Object.keys(schema.tree).forEach((path) => {
          if (["_id", "__v", "createdAt", "updatedAt"].includes(path)) return;
          const schemaType = schema.paths[path];
          if (!schemaType) return;
          if (schemaType.schema) {
            const subSchema = {};
            Object.entries(schemaType.schema.paths).forEach(([subPath, subType]) => {
              subSchema[subPath] = subType.defaultValue;
            });
            simplifiedSchema[path] = [subSchema];
          } else {
            let val = schemaType.defaultValue;
            if (val === undefined) {
              const inst = schemaType.instance || '';
              if (inst === 'String') val = '';
              else if (inst === 'Number') val = 0;
              else if (inst === 'Boolean') val = false;
              else if (inst === 'Date') val = null;
              else if (inst === 'ObjectId' || inst === 'ObjectID') val = '';
              else if (inst === 'Array') val = [];
            }
            simplifiedSchema[path] = val;
          }
        });
        res.json(simplifiedSchema);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
    ,
  };
};
module.exports = genericController;
