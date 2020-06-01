const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    category: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    quantity:{
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Products', productSchema);