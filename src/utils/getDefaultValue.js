const mongoose = require('mongoose');

function getDefaultValue(value, key) {

  if(/^([01]\d|2[0-3]):([0-5]\d)$/.test(value))
    return `${new Date().getHours()}:${new Date().getMinutes()}`

  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];

  if (Array.isArray(value)) {
    if (
      value.every(
        (item) => item.hasOwnProperty("value") && item.hasOwnProperty("label")
      )
    )
      return [{ value: "", label: "" }];
  }
  
  if (value.hasOwnProperty("value") && value.hasOwnProperty("label")) {
    return { value: "", label: "" };
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, _]) => [key, ""]) 
    );
  }

  return null;
}

module.exports = getDefaultValue;
