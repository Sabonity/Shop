// Import of different dependencies from NPM
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

//Import Route
const productRoute = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const cartRoute = require('./routes/cartRoute');
const orderRoute = require('./routes/orderRoute');

//Attempting to connect to the mongoDB Atlas

dotenv.config();

mongoose.connect(process.env.DB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log('Successfully connected to the DB')
);

//Middleware
app.use(express.json());

app.use('/', userRoute);
app.use('/product', productRoute);
app.use('/cart', cartRoute);
app.use('/order', orderRoute);


app.listen(3000, () => console.log('Server Up and running'));