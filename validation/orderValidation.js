const Joi = require('@hapi/joi');

const orderDecisionValidation = data => {
    const schema = Joi.object({
        decision: Joi.string()
            .required()
            .min(4),
        orderId: Joi.string()
                .required()
    });

    return schema.validate(data);
}

module.exports.orderDecisionValidation = orderDecisionValidation;