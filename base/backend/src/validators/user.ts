import Joi from 'joi'

export const updateProfile = Joi.object({
  username: Joi.string().min(3).max(30),
  twitterUrl: Joi.string().uri().allow('', null),
  discordTag: Joi.string().max(50).allow('', null),
  twitchUrl: Joi.string().uri().allow('', null),
  youtubeUrl: Joi.string().uri().allow('', null),
})

export const riotInit = Joi.object({
  gameName: Joi.string().min(1).max(50).required(),
  tagLine: Joi.string().min(1).max(10).required(),
  region: Joi.string().valid(
    'br1', 'na1', 'la1', 'la2', 'euw1', 'eun1',
    'tr1', 'ru', 'me1', 'kr', 'jp1', 'oc1', 'sg2', 'tw2', 'vn2'
  ).required(),
})

export const riotVerify = Joi.object({
  step: Joi.number().valid(1, 2).required(),
})

export const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'As senhas não coincidem' }),
})
