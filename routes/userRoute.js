/*
  This router is design for user related processes(API services)
  (Registration and Login)
*/

//Import dependency
const router = require('express').Router();

//userController
const { loginController, regsitrationController } = require('../controllers/userController');





//Account creation for the user
router.post('/register', async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ""
    }
    try {
        let isSuccessfulRegsitration = await regsitrationController(req.body);
        if (!isSuccessfulRegsitration.sucess) {
            response.message = isSuccessfulRegsitration.message;
            return res.status(404).send(response);
        }
        response.success = true;
        response.message = isSuccessfulRegsitration.message;
        return res.status(200).send(response);
    } catch (error) {
        console.log(error);
        return res.status(404).send(response);
    }
});



//Account Sign in process
router.post('/login', async (req, res) => {
    //Initliazing standard response
    let response = {
        success: false,
        message: ""
    }
    try {
        let isValidAccount = await loginController(req.body);
        if (!isValidAccount.success) {
            response.message = isValidAccount.message;
            return res.status(404).send(response);
        }
        res.setHeader('auth-Token', isValidAccount.authToken);
        response.message = isValidAccount.message;
        response.success = true;
        return res.status(200).send(response);
    } catch (error) {
        console.log(`Error encountered in login route: ${error}`);
        response.message = isValidAccount.message;
        return res.status(404).send(response);
    }
})



module.exports = router;


