/*
    Order Route holds all the service regarding the placing of order, accept order,
    deny order.
*/
const router = require('express').Router();
const tokenVerification = require('../validation/verifyToken');

//Import orderController,
const { placeOrder, viewActiveOrder, viewOrderHistory, updatePlacedOrder } = require('../controllers/orderController');

//Initialize standard response format
let response = {
    success: false,
    message: ''
};

router.post('/:id', tokenVerification, async (req, res) => {
    try {
        clearResponse();
        let data = {
            userId: req.user._id,
            cartId: req.params.id
        }
        let placeUsersOrder = await placeOrder(data);
        if (!placeUsersOrder.success) {
            response.message = placeUsersOrder.message;
            return res.status(404).send(response);
        }

        response.message = placeUsersOrder.message;
        response.success = true;
        return res.status(200).send(response);
    } catch (error) {
        console.log(`Encountered error while placing order: ${error}`);
        response.message = placeUsersOrder.message;
        return res.status(404).send(response);
    }
});


// Can view placed order (User)
// Can view all placed order by users
router.get('/activeOrder', tokenVerification, async (req, res) => {
    try {
        clearResponse();
        let viewOrders = await viewActiveOrder(req.user._id);
        if (!viewOrders.success) {
            response.message = viewOrders.message;
            return res.status(404).send(response);
        }

        return res.status(200).send(viewOrders.message);
    } catch (error) {
        console.log(`Error encountered while fetching placed order: ${error}`);
        response.message = viewOrders.message;
        return res.status(404).send(response);
    }
});

router.get('/orderHistory', tokenVerification, async (req, res) => {
    try {
        clearResponse();
        let viewOrders = await viewOrderHistory(req.user._id);
        if (!viewOrders.success) {
            response.message = viewOrders.message;
            return res.status(404).send(response);
        }

        return res.status(200).send(viewOrders.message);
    } catch (error) {
        console.log(`Error encountered while fetching placed order history: ${error}`);
        response.message = viewOrders.message;
        return res.status(404).send(response);
    }
});

router.put('/', tokenVerification, async (req, res) => {
    try {
        clearResponse();
        let orderUpdate = await updatePlacedOrder({
            userId: req.user._id,
            order_Id: req.body.orderId,
            todo: req.body.decision,
            message: req.body.message
        });
        if (!orderUpdate.success) {
            response.message = orderUpdate.message;
            return res.status(404).send(response);
        }

        response.message = orderUpdate.message;
        response.success = true;
        return res.status(200).send(response);
    } catch (error) {
        console.log(`Error encountered while updating the order: ${error}`);
        response.message = orderUpdate.message;
        return res.status(404).send(response);
    }
});

router.get('/', tokenVerification)

const clearResponse = () => {
    response.success = false;
    response.message = '';
}





module.exports = router;