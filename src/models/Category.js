const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
        default: ''
    },
    name: {
        type: String,
        required: true,
        default: ''
    },
}, {
    timestamps: true
});
module.exports = mongoose.model('Category', categorySchema);
