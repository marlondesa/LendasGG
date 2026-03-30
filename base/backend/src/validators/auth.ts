import Joi from 'joi'

export const register = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().min(3).max(30).required(),
})

export const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
})

export const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
})
