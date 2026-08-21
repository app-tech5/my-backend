const pluralize = require("pluralize");
const convertToModelName = (collectionName) => {
  if (!collectionName || typeof collectionName !== "string") {
    throw new Error("Invalid collection name");
  }
  if (collectionName === 'deliverysettings') {
    return 'DeliverySetting';
  }
  if (collectionName === 'app_settings') {
    return 'AppSetting';
  }
  if (collectionName === 'restaurantpaymentsettings') {
    return 'RestaurantPaymentSetting';
  }
  if (collectionName === 'customersupports') {
    return 'CustomerSupport';
  }
  if (collectionName === 'paymentmethods') {
    return 'PaymentMethod';
  }
  if (collectionName === 'sponsoredlistings') {
    return 'SponsoredListing';
  }
  return (
    pluralize.singular(collectionName).charAt(0).toUpperCase() +
    pluralize.singular(collectionName).slice(1));

};
module.exports = convertToModelName;
