const User = require('../models/User.js');
const Product = require('../models/Product');

const { productCreationValidation } = require('../validation/productValidation');


const getProductById = async (productId) => {
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {
        controllerResponse.message = false;
        let doesProductExist = await doesProductExistbyId(productId);
        if (!doesProductExist) {
            controllerResponse.message = `Product doesn't exist`;
            return controllerResponse;
        }
        controllerResponse.message = doesProductExist;
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Error encountered in getProductById: ${error}`);
        controllerResponse.message = `Error encountered while fetching the product`;
    } finally {
        return controllerResponse;
    }
}


const addNewProduct = async ({ userId, data }) => {
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {
        controllerResponse.message = false;
        //Checking if the user have a admin access
        let isAdmin = await doesHaveAdminAccess(userId);

        if (!isAdmin) {
            controllerResponse.message = `You're not allowed to access this service `
            return controllerResponse;
        }

        //Checking if the new product is valid for creation
        let isValidForNewProduct = await newProductValidation(data, 'create');
        if (!isValidForNewProduct.success) {
            controllerResponse.message = isValidForNewProduct.message;
            return controllerResponse;
        }

        //Product Creation
        const product = new Product(data);
        await product.save();
        controllerResponse.message = 'Product creation was successful'
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Encountered error while adding new product : ${error}`);
        controllerResponse.message = `Encountered error while adding new product`;
    } finally {
        return controllerResponse;
    }
}

const productDeletion = async ({ user_id, product_Id }) => {
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {
        controllerResponse.message = false;
        //Checking if the user have a admin access and product exist
        let accessAndProduct = await accessAndProductChecking({ userId: user_id, productId: product_Id });
        if (!accessAndProduct.success) {
            controllerResponse.message = accessAndProduct.message;
            return controllerResponse
        }

        //Product deletion
        await Product.findByIdAndDelete({ _id: product_Id });

        controllerResponse.message = 'Product was successfully deleted';
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Encountered error while deleting the product : ${error}`);
        controllerResponse.message = `Encountered error while deleting the product`;
    } finally {
        return controllerResponse;
    }
}

const productUpdate = async ({ user_id, product_Id, data }) => {
    let controllerResponse = {
        success: false,
        message: ''
    }
    try {

        let accessAndProduct = await accessAndProductChecking({ userId: user_id, productId: product_Id });
        if (!accessAndProduct.success) {
            controllerResponse.message = accessAndProduct.message;
            return controllerResponse;
        }

        //Checking if the new product is valid for creation
        let isValidForNewProduct = await newProductValidation(data, 'update');
        if (!isValidForNewProduct.success) {
            controllerResponse.message = isValidForNewProduct.message;
            return controllerResponse
        }
    
        let productUpdate = await Product.findOneAndUpdate({ _id: accessAndProduct.message._id }, data, {
            new: true,
            useFindAndModify: false
        });
        await productUpdate.save();

        controllerResponse.message = 'Product was successfully deleted';
        controllerResponse.success = true;
    } catch (error) {
        console.log(`Encountered error while updating the product : ${error}`);
        controllerResponse.message = `Encountered error while updating the product`;
    } finally {
        return controllerResponse;
    }
}


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



const newProductValidation = async (data, process) => {
    let checkingResponse = {
        success: false,
        message: ''
    }
    try {
        //input validation using Joi
        let productValidation = productCreationValidation(data);
        if ('error' in productValidation) {
            const { error } = productValidation;
            checkingResponse.message = error.details[0].message;
            return checkingResponse;
        }

        //Checking if the product name already exist
        let tempData = { ...data };
        if (process === 'update') {
            tempData.productName = 'sample';
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
        checkingResponse.message = `There's an error encountered....`;
        return checkingResponse;
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
        checkingResponse.message = `There's an error encountered....`;
        return checkingResponse;
    }
}


module.exports.getProductById = getProductById;
module.exports.addNewProduct = addNewProduct;
module.exports.productDeletion = productDeletion;
module.exports.productUpdate = productUpdate;