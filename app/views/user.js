"use strict"
const Joi = require('joi');

const userSchema={}
userSchema.registerationSchema =Joi.object({
    username: Joi.string().min(3).max(15).required().pattern(/^[^@]+$/),
    email: Joi.string().email().required(),
    password: Joi.string()
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters long'
    }),
    mobile:Joi.string().required(),//registe
})








module.exports = userSchema;