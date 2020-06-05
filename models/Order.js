const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    status: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    message: {
        type: String,
        required: true
    },
    carts: {
        type: Array
    },
    price: {
        type: Number,
        required: true
    },
    orderFlag: {
        type: Boolean,
        required: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);