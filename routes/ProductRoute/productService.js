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

        //Checking if the new product is valid for creation
        let isValidForNewProduct = await newProductValidation(req.body, 'create');
        if (!isValidForNewProduct.success) {
            response.message = isValidForNewProduct.message;
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
    try {

        //Checking if the user have a admin access and product exist
        let accessAndProduct = await accessAndProductChecking({ userId: req.user._id, productId: req.params.id });
        if (!accessAndProduct.success) {
            response.message = accessAndProduct.message;
            return res.status(404).send(response);
        }

        //Product deletion
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


router.put('/:id', tokenVerification, async (req, res) => {
    try {
        //Checking if the user have a admin access and product exist
        let accessAndProduct = await accessAndProductChecking({ userId: req.user._id, productId: req.params.id });
        if (!accessAndProduct.success) {
            response.message = accessAndProduct.message;
            return res.status(404).send(response);
        }

        //Checking if the new product is valid for creation
        let isValidForNewProduct = await newProductValidation(req.body, 'update');
        if (!isValidForNewProduct.success) {
            response.message = isValidForNewProduct.message;
            return res.status(404).send(response);
        }

        let productUpdate = await Product.findOneAndUpdate({ _id: accessAndProduct.message._id }, req.body, {
            new: true,
            useFindAndModify: false
        });
        await productUpdate.save();

        response.success = true;
        response.message = 'Updating product was successful';
        return res.status(200).send(response);

    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered while updating of the product`;
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

//This function will check if the user have a admin access and if the product exist
const accessAndProductChecking = async data => {
    let checkingResponse = {
        success: false,
        message: ''
    }
    let { userId, productId } = data;
    try {
        let isAdmin = await doesHaveAdminAccess(userId);

        if (!isAdmin) {
            checkingResponse.message = `You're not allowed to access this service `
            return checkingResponse;
        }

        //checking if the productExist using Id
        let doesProductExist = await doesProductExistbyId(productId);
        if (!doesProductExist) {
            checkingResponse.message = `Invalid Product Id`;
            return checkingResponse;
        }

        checkingResponse.success = true;
        checkingResponse.message = doesProductExist._id;
        return checkingResponse;
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered....`;
        return checkingResponse;
    }
}


const newProductValidation = async (data, process) => {
    let checkingResponse = {
        success: false,
        message: ''
    }
    try {
        //input validation using Joi
        let productValidation = productCreationValidation(data);
        if ('error' in productValidation) {
            const { error } = productValidation
            checkingResponse.message = error.details[0].message;
            return checkingResponse;
        }

        //Checking if the product name already exist
        let tempData = {...data};
        if(process === 'update'){
            tempData.productName = 'sample';
            console.log('UPDATE ----');
        }
        let productExist = await doesProductExist(tempData);
        if (productExist) {
            checkingResponse.message = `Product already exist`;
            return checkingResponse;
        }
        checkingResponse.success = true;
        return checkingResponse;
    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered....`;
        return checkingResponse;
    }

}


module.exports = router;