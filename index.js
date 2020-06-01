// Import of different dependencies from NPM
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

//Import Route
// const productRoute = require('./routes/ProductRoute/product');
const userRoute = require('./routes/UserRoute/userAuth');

//Attempting to connect to the mongoDB Atlas

dotenv.config();

mongoose.connect(process.env.DB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log('Successfully connected to the DB')
);

//Middleware
app.use(express.json());

app.use('/', userRoute);


app.listen(3000, () => console.log('Server Up and running'));