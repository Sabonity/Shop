const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    products: {
        type: Array
    },
    total: {
        type: Number,
        required: true
    },
    cartFlag: {
        type: Boolean,
        required: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Cart', cartSchema);