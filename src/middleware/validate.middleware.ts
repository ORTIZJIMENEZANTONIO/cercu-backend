import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "./errorHandler.middleware";

export function validate(
  schema: Joi.ObjectSchema,
  property: "body" | "query" | "params" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return next(new AppError(messages, 400));
    }

    req[property] = value;
    next();
  };
}
