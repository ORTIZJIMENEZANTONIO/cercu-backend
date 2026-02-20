import Joi from 'joi';

export const requestOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
});

export const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required(),
  code: Joi.string().length(4).required(),
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().max(150).optional().allow('', null),
  dateOfBirth: Joi.string().isoDate().optional().allow('', null),
});

export const googleAuthSchema = Joi.object({
  credential: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  dateOfBirth: Joi.string().isoDate().optional().allow('', null),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});