
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const { orderDecisionValidation } = require('../validation/orderValidation');

let controllerResponse = {
    success: false,
    message: ''
}
//For user access only, placing of order
const placeOrder = async ({ userId, cartId }) => {
    try {
        clearControllerResponse();

        //Checking if they have a correct access
        let isCorrectUser = await userValidation(userId);
        if (!isCorrectUser) {
            controllerResponse.message = `Invalid User Access`;
            return controllerResponse;
        }

        //Checking if the cart is valid
        let isValidCart = await cartValidation(userId, cartId);
        if (!isValidCart) {
            controllerResponse.message = `Cart doesn't exist`;
            return controllerResponse;
        }

        //Checking if the cart containse atleast 1 product
        if (isValidCart.products.length === 0) {
            controllerResponse.message = `You don't have any product in your cart`;
            return controllerResponse;
        }

        //OrderCreation
        let isOrderCreated = await doCreateOrder(userId, isValidCart);
        if (!isOrderCreated) {
            controllerResponse.message = `Failed in order creation`;
            return controllerResponse;
        }

        controllerResponse.message = `Your order was placed successfully`;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error encountered while placing order: ${error}`);
        controllerResponse.message = `Error encountered while placing order`;
    } finally {
        return controllerResponse;
    }
}

//The User and Admin can view the active order(placed order)
const viewActiveOrder = async (userId) => {
    try {
        clearControllerResponse();
        //Check if the user have an admin access    
        let isCorrectUser = await userValidation(userId);
        if (isCorrectUser) {
            //User access
            let userOrder = await Order.find({
                userId: userId,
                orderFlag: true
            });
            controllerResponse.message = userOrder;
            controllerResponse.success = true;
            return controllerResponse;
        }
        //Admin  Access
        let placedOrders = await Order.find({
            orderFlag: true
        });
        controllerResponse.message = placedOrders;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error encountered in getProductById: ${error}`);
        controllerResponse.message = `Error encountered while fetching the placed order`;
    } finally {
        return controllerResponse;
    }
}

//The User and Admin can view the inactive order(change with the status of the order),
//whether the order was accepted or denied.
const viewOrderHistory = async (userId) => {
    try {
        clearControllerResponse();
        //Check if the user have an admin access    
        let isCorrectUser = await userValidation(userId);
        if (isCorrectUser) {
            //User access
            let userOrder = await Order.find({
                userId: userId,
                orderFlag: false
            });
            controllerResponse.message = userOrder;
            controllerResponse.success = true;
            return controllerResponse;
        }
        //Admin  Access
        let placedOrders = await Order.find({
            orderFlag: false
        });
        controllerResponse.message = placedOrders;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error encountered in getProductById: ${error}`);
        controllerResponse.message = `Error encountered while fetching placed order history`;
    } finally {
        return controllerResponse;
    }
}

const updatePlacedOrder = async ({ userId, order_Id, todo, message }) => {
    try {
        //Checking if they have a correct access
        let allowedDecision = ['Approve', 'Deny'];
        let isCorrectUser = await userValidation(userId);
        if (isCorrectUser) {
            controllerResponse.message = `Invalid User Access`;
            return controllerResponse;
        }

        //Input validation
        let isValidUpdate = orderDecisionValidation({
            orderId: order_Id,
            decision: todo
        });
        if ('error' in isValidUpdate) {
            const { error } = isValidUpdate;
            controllerResponse.message = error.details[0].message;
            return controllerResponse;
        }

        //Checking if the orderId exist
        let doesOrderExist = await Order.findOne({
            orderFlag: true,
            _id: order_Id
        });
        if (doesOrderExist === null) {
            controllerResponse.message = `Order doesn't exist`;
            return controllerResponse;
        }

        //Checking if the decision was allowed (Approve and Deny)
        let isDecisionAllowed = allowedDecision.findIndex(decision => decision === todo);
        if (isDecisionAllowed < 0) {
            controllerResponse.message = `The only allowed decision was approve and deny`;
            return controllerResponse;
        }

        if (todo === 'Approve') {
            let orderApproved = await processAcceptedOrder(doesOrderExist, message);
            if (!orderApproved.success) {
                controllerResponse.message = orderApproved.message;
                return controllerResponse;
            }
        } else {
            let orderDenied = await processDeniedOrder(doesOrderExist, message);
            if (!orderDenied) {
                controllerResponse.message = `Error encountered while updating the order status from 'Pending' to 'Denied'`;
                return controllerResponse;
            }
        }
        controllerResponse.message = `The order status updated successfully`;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error encountered in getProductById: ${error}`);
        controllerResponse.message = `Error encountered while updating the order`;
    } finally {
        return controllerResponse;
    }
}

//Clean the previous value of the response
const clearControllerResponse = () => {
    controllerResponse.success = false,
        controllerResponse.message = ''
}

//Checking if the user have a correct access
const userValidation = async (userId) => {
    try {
        let isCorrectUser = await User.findById(userId);
        if (isCorrectUser.access !== 'user') return false;
        return true;
    } catch (error) {
        console.log(`Error encountered in userValidation: ${error}`);
        return false;
    }
}

//Checking if the cart is valid for order placing
const cartValidation = async (userId, cartId) => {
    try {
        let isValidCart = await Cart.findOne({
            _id: cartId,
            userId: userId,
            cartFlag: true
        });
        if (isValidCart === null) return false
        return isValidCart;
    } catch (error) {
        console.log(`Error encountered in cartValidation: ${error}`);
        return false;
    }
}

//Order creation process
const doCreateOrder = async (userId, cartDetails) => {
    try {
        await doUpdateCartFlag(userId, cartDetails);
        await doSaveOrder(userId, cartDetails);
        await doCreateNewCart(userId);
        return true;
    } catch (error) {
        console.log(`Error encountered in createOrder: ${error}`);
        return false;
    }
};

//Update the flag from true to false
const doUpdateCartFlag = async (userId, cartDetails) => {
    try {
        cartDetails.cartFlag = false;
        let updateCart = await Cart.findOneAndUpdate({
            userId: userId,
            _id: cartDetails._id,
            cartFlag: true
        }, cartDetails, {
            new: true,
            useFindAndModify: false
        });
        await updateCart.save();
    } catch (error) {
        console.log(`Error encountered in doUpdateCartFlag: ${error}`);
    }
}

//Create order in db
const doSaveOrder = async (userId, cartDetails) => {
    try {
        let orderObject = new Order({
            userId: userId,
            status: `Pending`,
            message: `Waiting for admin approval`,
            carts: cartDetails,
            price: cartDetails.total,
            orderFlag: true
        });
        await orderObject.save();
    } catch (error) {
        console.log(`Error encountered in doSaveOrder: ${error}`);
    }
}

//Create new cart for the user
const doCreateNewCart = async (userId) => {
    try {
        let newCartObject = new Cart({
            userId: userId,
            total: 0,
            cartFlag: 1
        });
        await newCartObject.save();
    } catch (error) {
        console.log(`Error encountered in doCreateNewCart: ${error}`);
    }
}

const processDeniedOrder = async (order, message) => {
    try {
        if ((message === null) || (typeof (message) == 'undefined')
            || (message === "")) {
            order.message = "The order was denied";
        } else {
            order.message = message;
        }
        order.status = 'Denied';
        order.orderFlag = false;
        let updateStatusToDenied = await Order.findOneAndUpdate({
            _id: order._id,
            orderFlag: true
        }, order, {
            new: true,
            useFindAndModify: false
        });
        await updateStatusToDenied.save();
        return true;
    } catch (error) {
        console.log(`Error encountered in processDeniedOrder: ${error}`);
        return false;
    }
}


const processAcceptedOrder = async (order, message) => {
    let approvedResponse = {
        success: false,
        message: ''
    }
    try {
        //Get the products inside the user cart
        let cartProducts = order.carts[0].products;

        if ((message === null) || (typeof (message) == 'undefined')
            || (message === "")) {
            order.message = "The order was denied";
        } else {
            order.message = message;
        }

        //Cart product mapping for quantity checking
        const doProductMapping = await productMapping(cartProducts, order._id, order);
        if (!doProductMapping.success) {
            approvedResponse.message = doProductMapping.message;
            return approvedResponse;
        }
        approvedResponse.message = `Good Job`;
        approvedResponse.success = true;
        return approvedResponse;
    } catch (error) {
        console.log(`Error encountered in processAcceptedOrder: ${error}`);
        approvedResponse.message = `Error encountered while updating the order status from 'Pending' to 'Approved'`;
        return approvedResponse;
    }
}

const productMapping = async (cartProducts, orderId, orderObject) => {
    try {
        let enoughStockFlag = true;
        let quantityCheckingMessage = '';
        let productList = [];
        await Promise.all(cartProducts.map(async cartProduct => {
            //Fetch the equivalent product in the inventory
            let inventoryProduct = await Product.findOne({
                _id: cartProduct.productId
            });
            productList.push(inventoryProduct);
            //Checking if there's enough stock for the users order
            let haveEnoughStock = await quantityChecking(cartProduct, inventoryProduct);
            enoughStockFlag &= haveEnoughStock.success;
            quantityCheckingMessage += haveEnoughStock.message;
        }));
        if (enoughStockFlag) {
            //Update inventory
            await updateInventoryStock(cartProducts, productList);
            orderObject.orderFlag = false;
            orderObject.status = 'Approved';
            await Order.findOneAndUpdate({
                _id: orderId,
                orderFlag: true
            }, orderObject, {
                new: true,
                useFindAndModify: false
            });
        }
        return ({ success: enoughStockFlag, message: quantityCheckingMessage });
    } catch (error) {
        console.log(`Encountered error in productMapping: ${error}`);
        return ({ success: false, message: `Error encountered while updating the status` });
    }
}

const updateInventoryStock = async (cartProducts, inventoryProduct) => {
    try {

        await Promise.all(cartProducts.map(async (cartProduct, index) => {
            let quantity = inventoryProduct[index].quantity - cartProduct.quantity;
            await updatateQuantity(inventoryProduct, index, quantity);
        }));
    } catch (error) {
        console.log(`Encountered error in updateInventoryStock ${error}`);
    }
}


const updatateQuantity = async (inventoryProduct, index, quantity) => {
    try {
        inventoryProduct[index].quantity = quantity;
        let saveUpdatedInventory = await Product.findOneAndUpdate({
            _id: inventoryProduct[index]._id
        }, inventoryProduct[index], {
            new: true,
            useFindAndModify: false
        });
    } catch (error) {
        console.log(`Encountered error in updatateQuantity ${error}`);
    }
}

const quantityChecking = async (cartProduct, inventoryProduct) => {
    let quanityCheckingResponse = {
        success: false,
        message: ''
    }
    try {
        if (cartProduct.quantity > inventoryProduct.quantity) {
            quanityCheckingResponse.message = `You don't have enough stock for product ${cartProduct.productName}. `;
            return quanityCheckingResponse;
        }
        quanityCheckingResponse.success = true;
        return quanityCheckingResponse
    } catch (error) {
        console.log(`Error encountered in quantityChecking: ${error}`);
        quanityCheckingResponse.message = `Error encountered in quantityChecking for product ${cartProduct.productName}. `;
        return quanityCheckingResponse;
    }
}



module.exports.placeOrder = placeOrder;
module.exports.viewActiveOrder = viewActiveOrder;
module.exports.viewOrderHistory = viewOrderHistory;
module.exports.updatePlacedOrder = updatePlacedOrder;