/*
 `Cart Service` file is dedicated for all the API service call
  that's related to cart. 
  The user can view,add,delete,update product to his/her cart.
*/

const router = require('express').Router();

//Import controller
const { viewCart, addProductToCart,
  deletProductInCart, editProductInCart } = require('../controllers/cartController');

//Import Validation middleware
const tokenVerification = require('../validation/verifyToken');


//Get the cart details of the user
router.get('/', tokenVerification, async (req, res) => {
  let response = {
    success: false,
    message: ''
  }
  try {
    let userId = req.user._id;
    let userCart = await viewCart(userId);
    if (!userCart.success) {
      response.message = userCart.message;
      return res.status(404).send(response);
    }
    return res.send(userCart.message);
  } catch (error) {
    console.log(`Error in while fetching cart` + error);
    response.message = `Error encountered while fetching the cart.`;
    return res.status(404).send(response);
  }

});

//Add product to the cart
router.post('/addProduct', tokenVerification, async (req, res) => {
  let response = {
    success: false,
    message: ''
  }
  try {
    let productAdd = await addProductToCart(req.user._id, req.body);
    if (!productAdd.success) {
      response.message = productAdd.message;
      return res.status(404).send(response);
    }
    response.success = true;
    response.message = productAdd.message;
    return res.send(response);
  } catch (error) {
    console.log(`Error encountered while adding product to cart` + error);
    response.message = `Error encountered while adding product to cart.`;
    return res.status(404).send(response);
  }
});

//Delete product from the cart
router.delete('/deleteProduct/:productId', tokenVerification, async (req, res) => {
  let response = {
    success: false,
    message: ''
  }
  try {
    let productId = req.params.productId;
    let productDeletion = await deletProductInCart({
      userId: req.user._id,
      cartProductId: productId
    });
    if (!productDeletion.success) {
      response.message = productDeletion.message;
      return res.status(404).send(response);
    }
    response.success = true;
    response.message = productDeletion.message;
    return res.send(response);
  } catch (error) {
    console.log(`Error encountered while deleting product from cart` + error);
    response.message = `Error encountered while deleting product to cart.`;
    return res.status(404).send(response);
  }
});


//Update product from the cart
router.put('/editProduct', tokenVerification, async (req, res) => {
  let response = {
    success: false,
    message: ''
  }
  try {
    let updateCartProduct = await editProductInCart({
      userId: req.user._id,
      data: req.body
    });

    if (!updateCartProduct.success) {
      response.message = updateCartProduct.message;
      return res.status(404).send(response);
    }

    response.success = true;
    response.message = updateCartProduct.message;
    return res.send(response);
  } catch (error) {
    console.log(`Error encountered while updating product from cart` + error);
    response.message = `Error encountered while updating product to cart.`;
    return res.status(404).send(response);
  }
})



module.exports = router;

