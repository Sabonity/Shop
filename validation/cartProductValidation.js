const Joi = require('@hapi/joi');

const productCreationValidation = data => {
    const schema = Joi.object({
        productId: Joi.string()
            .required()
            .min(6),
        quantity: Joi.number()
                .integer()
                .min(0)
    });

    return schema.validate(data);
}

module.exports.productCreationValidation = productCreationValidation;