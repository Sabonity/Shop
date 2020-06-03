/*
    User controller
    Login and Registration controller
*/
//Import dependency
const router = require('express').Router();
const User = require('../models/User');
const Cart = require('../models/Cart');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Joi validation
const { userRegistrationValidation } = require('../validation/userValidation');

//Sign in porcess
const loginController = async (userData) => {
    //Initializing standard response
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {
        controllerResponse.message = false;
        //Checking if the username exist
        const userAccount = await User.findOne({ userName: userData.userName });;

        if (userAccount === null) {
            controllerResponse.message = "Login unsuccessful. Incorrect username or password";
            return controllerResponse;
        }

        //Comparing user input password to the hashed password
        const validPass = await bcrypt.compare(userData.password, userAccount.password);
        if (!validPass) {
            console.log("loginController1");
            controllerResponse.message = "Login unsuccessful. Incorrect username or password";
            return controllerResponse;
        }
        console.log("loginController1");
        //Token creation
        const token = jwt.sign({ _id: userAccount._id }, process.env.TOKEN_SECRET, { expiresIn: '10h' });


        controllerResponse.message = 'Login successful';
        controllerResponse.authToken = token;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in loginController: ${error}`);
        controllerResponse.message = `Error encountered while the user try to sign in`;
    } finally {
        return controllerResponse;
    }
}


const regsitrationController = async (userData) => {
    //Initializing standard response
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {
        controllerResponse.message = false;
        // validation of userInput for the registration process
        const validation = userRegistrationValidation(userData);

        if ('error' in validation) {
            const { error } = validation;
            controllerResponse.message = errorMessageTrim(error.details[0].message);
            return controllerResponse;
        }

        //Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(userData.password, salt)
        userData.password = hashPassword

        //Initialize that the user access is limited to user only
        userData.access = 'user';

        //User validation if some of the user input already exist
        let checkingResult = await userDetailsChecking(userData);
        console.log(checkingResult)
        if (checkingResult.success === false) {
            controllerResponse.message = checkingResult.message;
            return controllerResponse;
        }

        //Creating a new instance of the user object
        const newUser = new User(userData);
        const createNewUser = await newUser.save();
        const createCart = new Cart({
            userId: createNewUser._id,
            total: 0,
            cartFlag: 1
        });

        await createCart.save();
        controllerResponse.message = 'Account registraion was successful';
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error in regsistationController: ${error}`);
        controllerResponse.message = `Error encountered in user registraion`;
    } finally {
        return controllerResponse;
    }
}


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


module.exports.loginController = loginController;
module.exports.regsitrationController = regsitrationController;
