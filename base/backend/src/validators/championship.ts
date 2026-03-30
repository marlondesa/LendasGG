import Joi from 'joi'

export const create = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  maxPlayers: Joi.number().integer().min(2).required(),
  prizePool: Joi.number().positive().required(),
  entryFee: Joi.number().positive().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
})

export const update = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  maxPlayers: Joi.number().integer().min(2).optional(),
  prizePool: Joi.number().positive().optional(),
  entryFee: Joi.number().positive().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
})
