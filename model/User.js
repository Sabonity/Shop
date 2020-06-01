const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    access:{
        type: String,
        required: true,
        min: 6,
    },
    userData: {
        firstName: {
            type: String,
            required: true,
            min: 2,
            max: 255
        },
        lastName:{
            type: String,
            required: true,
            min: 2,
            max: 255
        }
    }
});

module.exports = mongoose.model('User', userSchema);