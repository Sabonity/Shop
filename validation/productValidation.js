const Joi = require('@hapi/joi');

//Validation of product creation
const productCreationValidation = data => {
    const schema = Joi.object({
        productName: Joi.string()
            .min(6)
            .required(),
        category: Joi.string()
            .min(6)
            .required(),
        quantity: Joi.number()
            .integer()
            .min(0)
            .max(10000)
            .required(),
        price: Joi.number()
            .integer()
            .min(0)
            .max(10000)
            .required()
    });

    return schema.validate(data);
}

module.exports.productCreationValidation = productCreationValidation;