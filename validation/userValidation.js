/*
    This will be use for the user input validation,
    this validation will determine if the input is valid/correct
    pattern.
*/

const Joi = require('@hapi/joi');

//User registration validation
const userRegistrationValidation = data => {
    const schema = Joi.object({
        userName: Joi.string()
            .min(6)
            .required(),
        email: Joi.string()
            .min(6)
            .required()
            .email(),
        password: Joi.string()
            .min(6)
            .required(),
        userData: {
            firstName: Joi.string()
                .min(2)
                .required(),
            lastName: Joi.string()
                .min(2)
                .required(),
        }
    });

    return schema.validate(data);
}


const userLoginValidation = data => {
    const schema = Joi.object({
        userName: Joi.string()
            .min(6)
            .required(),
        password: Joi.string()
            .min(6)
            .required(),
    });
    return schema.validate(data);
}

module.exports.userRegistrationValidation = userRegistrationValidation;
module.exports.userLoginValidation = userLoginValidation;
