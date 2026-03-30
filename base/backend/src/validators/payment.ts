import Joi from 'joi'

export const createIntent = Joi.object({
  championshipId: Joi.string().uuid().required(),
})
