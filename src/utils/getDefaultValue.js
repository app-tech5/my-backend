function getDefaultValue(value) {
    if (typeof value === "string") return "";
    if (typeof value === "number") return 0;
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return [];
    if (typeof value === "object" && value !== null) return {};
    return null;
}

module.exports = getDefaultValue;