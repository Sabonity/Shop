/*
 `Product Service` file is dedicated for all the API service call
  that's related to product. Not all the user can access the API
  because of the user restriction
  CREATE, READ, UPDATE, DELETE

*/

//Import all the depencies
const router = require('express').Router();
const User = require('../../models/User');
const Product = require('../../models/Product');
const tokenVerification = require('../../validation/verifyToken');
const { productCreationValidation } = require('../../validation/productValidation');

//Initliazing standard response
let response = {
    success: false,
    message: ''
};

//Fetch all available product from the DB.
router.get("/", tokenVerification, async (req, res) => {
    try {
        const products = await Product.find();
        return res.status(200).send(products);
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered while fetching the products`;
        return res.status(404).send('Error: :' + error);
    }
});

//Fetch specific product
router.get("/:id", tokenVerification, async (req, res) => {
    console.log(req.params.id);

    //Validation to catch the null and undefined product Id 
    if (!req.params.id) {
        response.message = `Product Id should not be null or undefined`;
        return res.status(404).send(response);
    }

    //checking if the productExist using Id
    try {
        let doesProductExist = await doesProductExistbyId(req.params.id);
        if (!doesProductExist) {
            response.message = `Product doesn't exist`;
            return res.status(404).send(response);
        }

        return res.status(200).send(doesProductExist);
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered while fetching the product`;
        return res.status(404).send('Error: :' + error);
    }

})


//Creation of new product
router.post("/", tokenVerification, async (req, res) => {

    let userId = req.user._id;
    try {
        //Checking if the user have a admin access
        let isAdmin = await doesHaveAdminAccess(userId);

        if (!isAdmin) {
            response.message = `You're not allowed to access this service `
            return res.status(401).send(response);
        }

        //input validation using Joi
        let productValidation = productCreationValidation(req.body);
        if ('error' in productValidation) {
            const { error } = productValidation
            response.message = error.details[0].message;
            return res.status(404).send(response);
        }

        //Checking if the product name already exist
        let productExist = await doesProductExist(req.body);
        if (productExist) {
            response.message = `Product already exist`;
            return res.status(404).send(response);
        }

        //Product Creation
        const product = new Product(req.body);
        await product.save();
        response.success = true;
        response.message = 'Product creation was successful'
        return res.status(200).send(response);
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered upon while creating the product`;
        return res.status(404).send('Error: :' + error);
    }
});


//Product deletion
router.delete('/:id', tokenVerification, async (req, res) => {
    let userId = req.user._id;
    try {

        //Validation to catch the null and undefined product Id
        if (!req.params.id) {
            response.message = `Product Id should not be null or undefined`;
            return res.status(404).send(response);
        }

        //Checking if the user have a admin access
        let isAdmin = await doesHaveAdminAccess(userId);

        if (!isAdmin) {
            response.message = `You're not allowed to access this service `
            return res.status(401).send(response);
        }

        //checking if the productExist using Id
        let doesProductExist = await doesProductExistbyId(req.params.id);
        if (!doesProductExist) {
            response.message = `Product doesn't exist`;
            return res.status(404).send(response);
        }

        await Product.findByIdAndDelete({ _id: req.params.id });
        response.success = true;
        response.message = 'Product was successfully deleted';
        return res.status(200).send(response);
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered while deleting of the product`;
        return res.status(404).send('Error: :' + error);
    }
});


/*
    Reusable Code
 */

//this function will determine if the user's access was admin or not
const doesHaveAdminAccess = async userId => {
    try {
        const userData = await User.findOne({ _id: userId });

        if (userData.access !== 'admin') return false;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//this function will determine if the product exist
const doesProductExist = async productData => {
    try {
        const { productName } = productData;
        let productExist = await Product.findOne({ productName: productName });

        if (productExist === null) return false;

        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
}

//this function will check if the productId exist
const doesProductExistbyId = async productId => {
    try {
        let product = await Product.findOne({ _id: productId });
        if (!product) return false;
        return product;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = router;