/*
 `Product Service` file is dedicated for all the API service call
  that's related to product. Not all the user can access the API
  because of the user restriction
  CREATE, READ, UPDATE, DELETE

*/

//Import all the depencies
const router = require('express').Router();
const tokenVerification = require('../validation/verifyToken');
const Product = require('../models/Product');

//Import controllers
const { getProductById, addNewProduct,
    productDeletion, productUpdate } = require('../controllers/productController');



//Fetch all available product from the DB.
router.get("/", tokenVerification, async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ''
    };
    try {
        const products = await Product.find();
        return res.status(200).send(products);

    } catch (error) {
        console.log(error);
        response.message = `Error encountered while fetching the products`;
        return res.status(404).send('Error: :' + error);
    }
});

//Fetch specific product
router.get("/:id", tokenVerification, async (req, res) => {
    //checking if the productExist using Id
    //Initliazing standard response
    let response = {
        success: false,
        message: ''
    };
    try {
        let getProduct = await getProductById(req.params.id)
        if (!getProduct.success) {
            response.message = getProduct.message;
            return res.status(404).send(response);
        }
        return res.status(200).send(getProduct.message);
    } catch (error) {
        console.log(`Error encountered in while fetching product (getProductId) : ${error}`);
        response.message = getProduct.message;
        return res.status(404).send(response);
    }
})


//Creation of new product
router.post("/addProduct", tokenVerification, async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ''
    };
    try {
        let isProductAdded = await addNewProduct({
            userId: req.user._id,
            data: req.body
        });

        if (!isProductAdded.success) {
            response.message = isProductAdded.message;
            return res.status(404).send(response);
        }
        response.message = isProductAdded.message;
        response.success = true;
        return res.send(response);
    } catch (error) {
        console.log(`Error encountered in while product creation: ${error}`);
        response.message = isProductAdded.message;
        return res.status(404).send(response);
    }
});

//Product deletion
router.delete('/deleteProduct/:id', tokenVerification, async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ''
    };
    try {
        let isProductDeleted = await productDeletion({
            user_id: req.user._id,
            product_Id: req.params.id
        });
        if (!isProductDeleted.success) {
            response.message = isProductDeleted.message;
            return res.status(404).send(response);
        }
        response.message = isProductDeleted.message;
        response.success = true;
        return res.send(response);

    } catch (error) {
        console.log(error);
        response.message = isProductDeleted.message
        return res.status(404).send(response);
    }
});


router.put('/updateProduct/:id', tokenVerification, async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ''
    };
    try {
        //Checking if the user have a admin access and product exist
        let isProductUpdated = await productUpdate({
            user_id: req.user._id,
            product_Id: req.params.id,
            data: req.body
        });
        
        if (!isProductUpdated.success) {
            response.message = isProductUpdated.message;
            return res.status(404).send(response);
        }
        response.success = true;
        response.message = 'Updating product was successful';
        return res.status(200).send(response);

    } catch (error) {
        console.log(error);
        response.message = `There's an error encountered while updating of the product`;
        return res.status(404).send('Error: :' + error);
    }
});

module.exports = router;