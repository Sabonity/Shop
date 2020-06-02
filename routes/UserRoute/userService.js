/*
  This router is design for user related processes(API services)
  (Registration and Login)
*/

//Import dependency
const router = require('express').Router();
const User = require('../../models/User');
const Cart = require('../../models/Cart');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Joi validation dependency
const { userRegistrationValidation, userLoginValidation } = require('../../validation/userValidation');

//Initliazing standard response
let response = {
    success: false,
    message: ""
}


//Account creation for the user
router.post('/register', async (req, res) => {

    //Initialize a standard response

    // validation of userInput for the registration process
    const validation = userRegistrationValidation(req.body);

    if ('error' in validation) {
        const { error } = validation;
        response.message = errorMessageTrim(error.details[0].message);
        return res.status(404).send(response);
    }

    //Password hashing
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt)
    req.body.password = hashPassword

    //Initialize that the user access is limited to user only
    req.body.access = 'user';

    //User validation if some of the user input already exist
    let checkingResult = await userDetailsChecking(req.body);
    console.log(checkingResult);

    if (checkingResult.success === false) {
        response.message = checkingResult.message;
        return res.status(404).send(response);
    }

    //Creating a new instance of the user object
    const newUser = new User(req.body);

    try {
        const createNewUser = await newUser.save();
        const createCart = new Cart({
            userId: createNewUser._id,
            total: 0,
            cartFlag: 1
        })
        await createCart.save();
        response.success = true;
        response.message = 'Account registraion was successful';
        return res.status(200).send(response);
    } catch (error) {
        console.log(error);
    }

});



//Account Sign in process
router.post('/login', async (req, res) => {

    //Input validation
    let validation = userLoginValidation(req.body);
    if ('error' in validation) {
        const { error } = validation;
        response.message = error.details[0].message;
        return res.status(404).send(response);
    }


    try {
        //Checking if the username exist
        const userAccount = await User.findOne({ userName: req.body.userName });

        if (userAccount === null) {
            response.message = "Login unsuccessful. Incorrect username or password";
            return res.status(404).send(response);
        }

        //Comparing user input password to the hashed password
        const validPass = await bcrypt.compare(req.body.password, userAccount.password);
        if (!validPass) {
            response.message = "Login unsuccessful. Incorrect username or password";
            return res.status(404).send(response);
        }

        //Token creation
        const token = jwt.sign({ _id: userAccount._id }, process.env.TOKEN_SECRET, { expiresIn: '2h' });

        response.success = true;
        response.message = 'Login successful';
        res.setHeader('auth-token', token);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error);
    }


})



//User data validation (if the data already exist)
const userDetailsChecking = async (userInputData) => {
    let detailCheckingResponse = {
        success: false,
        message: 'Successful'
    }
    let doesDetailExist = [
        { email: userInputData.email },
        { userName: userInputData.userName },
        {
            userData: userInputData.userData
        }
    ]

    try {
        doesEmailExist = await User.findOne(doesDetailExist[0]);
        doesUserNameExist = await User.findOne(doesDetailExist[1]);
        doesUserDataExist = await User.findOne(doesDetailExist[2]);

        if (doesEmailExist !== null) {
            detailCheckingResponse.message = 'Email address already exist';
        } else if (doesUserNameExist !== null) {
            detailCheckingResponse.message = 'Username already exist';
        } else if (doesUserDataExist !== null) {
            detailCheckingResponse.message = 'User already exist';
        } else {
            detailCheckingResponse.success = true;
        }
        return detailCheckingResponse;
    } catch (error) {
        console.log(error);
    }
}


//Error message trim to hide the model structure
const errorMessageTrim = message => {
    let trimMessage = message.replace('userData.', '');
    return trimMessage;
}

module.exports = router;


