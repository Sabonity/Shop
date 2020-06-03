
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { productCreationValidation } = require('../validation/cartProductValidation');


//Controller that handles the view cart route
const viewCart = async (userId) => {
    let controllerResponse = {
        success: false,
        message: ''
    }

    try {
        controllerResponse.message = false;
        //Checking if the cart exist
        let doesCartExist = await getCartbyId(userId);
        if ((doesCartExist === null)) {
            controllerResponse.message = `Cart not found`;
            return controllerResponse;
        }

        controllerResponse.message = doesCartExist
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in getCart controller (viewCart) : ` + error);
        controllerResponse.message = 'Error encountered while fetching the cart.';
    } finally {
        return controllerResponse;
    }
}

// addProduct Controller
const addProductToCart = async (userId, productData) => {
    let controllerResponse = {
        success: false,
        message: ''
    }

    //Checking if the cart exist
    try {
        controllerResponse.message = false;
        let doesCartExist = await getCartbyId(userId);
        if (doesCartExist === null) {
            controllerResponse.message = `Cart not found`;
            return controllerResponse;
        }

        //Input validation
        let isValidProductInput = await productInputValidation(productData);
        if (!isValidProductInput.success) {
            controllerResponse.message = isValidProductInput.message;
            return controllerResponse;
        }

        //search the product in the inventory 
        let doesProductExist = await getProductbyId(productData.productId);
        if (doesProductExist === null) {
            controllerResponse.message = `Product not found`;
            return controllerResponse;
        }

        //AddToCart and updateCart process
        await savingProducInCart(productData, doesProductExist, doesCartExist, "POST");
        controllerResponse.message = "The product was successfully added to the cart";
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in adding product to cart : ` + error);
        controllerResponse.message = 'Error encountered while adding product to cart.';
    } finally {
        return controllerResponse;
    }
}

const deletProductInCart = async ({ userId, cartProductId }) => {
    let controllerResponse = {
        success: false,
        message: ''
    }

    try {
        controllerResponse.message = false;
        //Checking if the cart exist
        let doesCartExist = await getCartbyId(userId);
        if (doesCartExist === null) {
            controllerResponse.message = `Cart not found`;
            return controllerResponse;
        }

        //Checking if the product exist in cart
        let isProdoductExistinCart = await doesProductExistInCart(cartProductId, doesCartExist);
        if (isProdoductExistinCart.index === -1) {
            controllerResponse.message = `Product doesn't exist`;
            return controllerResponse;
        }

        //Remove the index that contains the product
        doesCartExist.products.splice(isProdoductExistinCart, 1);

        //Finally update the db content
        computeTotalPrice(doesCartExist);
        await updateProductsInCart(doesCartExist);

        controllerResponse.message = "The product was successfully deleted to the cart";
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in deletion of cart product(deletProductInCart) : ` + error);
        controllerResponse.message = 'Error encountered while deleting product in cart.';
    } finally {
        return controllerResponse;
    }
}

const editProductInCart = async ({ userId, data }) => {
    let controllerResponse = {
        success: false,
        message: ''
    }

    try {
        controllerResponse.message = false;
        //Checking if the cart exist
        let doesCartExist = await getCartbyId(userId);
        if (doesCartExist === null) {
            controllerResponse.message = `Cart not found`;
            return controllerResponse;
        }

        //Input validation
        let isValidProductInput = await productInputValidation(data);
        if (!isValidProductInput.success) {
            controllerResponse.message = isValidProductInput.message;
            return controllerResponse;
        }

        //search the product in the inventory 
        let doesProductExist = await getProductbyId(data.productId);
        if (doesProductExist === null) {
            controllerResponse.message = `Product not found`;
            return controllerResponse;
        }

        //Checking if the product exist in cart
        let isProdoductExistinCart = doesProductExistInCart(data.productId, doesCartExist);
        if (isProdoductExistinCart.index === -1) {
            controllerResponse.message = `Product doesn't exist`;
            return controllerResponse;
        }

        await savingProducInCart(data, doesProductExist, doesCartExist, "PUT");
        controllerResponse.message = "Updating the product in cart was successful";
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in updateCartProduct controller (editProduct) : ` + error);
        controllerResponse.message = 'Error encountered while updating product in cart.';
    } finally {
        return controllerResponse;
    }
}


//Fetching cart for user
const getCartbyId = async (userIdParam) => {
    try {
        let cartDetails = await Cart.findOne({ userId: userIdParam, cartFlag: true });
        return cartDetails;
    } catch (error) {
        console.log(`getCartbyId function error: ` + errror);
        return null;
    }
}


//Fetch Product from productList
const getProductbyId = async (productId) => {
    try {
        let productDetails = await Product.findOne({ _id: productId });
        return productDetails;
    } catch (error) {
        console.log(`getProductbyId functiuon error : ` + error);
    }
}

//Input product validation using @hapi/joi
const productInputValidation = async (productData) => {
    let inputValidation = productCreationValidation(productData);
    if ('error' in inputValidation) {
        const { error } = inputValidation;
        return ({ success: false, message: error.details[0].message });
    }
    return ({ success: true });
}

//Validation if the product exist in the cart
//if(exist) update the product in cart
//else add product
const savingProducInCart = async (productData, productDetails, cartDetails, toDoProcess) => {
    try {
        let process = doesProductExistInCart(productData.productId, cartDetails);

        //To check if the request is a POST  request(add new product / add quantity to the existing product)
        //Or PUT request (update the quantity depends on the user input)
        if (toDoProcess === "POST") {
            if (process.do === "create") {
                let productObject = {
                    productId: productData.productId,
                    productName: productDetails.productName,
                    quantity: productData.quantity,
                    price: productData.quantity * productDetails.price
                };
                console.log(productObject);
                cartDetails.products.push(productObject);
                computeTotalPrice(cartDetails);
                await updateProductsInCart(cartDetails);
            } else {
                //Update the products in cart by adding new quantity to existing quantity
                assembleArrayObject(productData, cartDetails.products, process.index, productDetails.price);
                computeTotalPrice(cartDetails);
                await updateProductsInCart(cartDetails);
            }
        } else {
            cartDetails.products[process.index].quantity = productData.quantity;
            cartDetails.products[process.index].price = productData.quantity * productDetails.price;
            computeTotalPrice(cartDetails);
            await updateProductsInCart(cartDetails);
        }
    } catch (error) {
        console.log(`savingProducInCart functiuon error : ` + error);
    }
}


const doesProductExistInCart = (productId, cartDetails) => {
    let products = cartDetails.products;
    let doesProductExist = products.findIndex(product => (product.productId === productId));
    if (doesProductExist >= 0) {
        return ({ do: "update", index: doesProductExist });
    }
    return ({ do: "create", index: -1 });
}

const updateProductsInCart = async (cartDetails) => {
    let updateCart = await Cart.findOneAndUpdate({ _id: cartDetails._id }, cartDetails, {
        new: true,
        useFindAndModify: false
    });
    await updateCart.save();
}

const assembleArrayObject = (newProductObject, productsInCart, index, price) => {
    productsInCart[index].quantity = productsInCart[index].quantity + newProductObject.quantity;
    productsInCart[index].price = productsInCart[index].quantity * price;
}

const computeTotalPrice = (cartDetails) => {
    let totalPrice = 0;
    let products = cartDetails.products;
    products.map(product => {
        totalPrice += product.price;
    });
    cartDetails.total = totalPrice;
}

module.exports.viewCart = viewCart;
module.exports.addProductToCart = addProductToCart;
module.exports.deletProductInCart = deletProductInCart;
module.exports.editProductInCart = editProductInCart;
