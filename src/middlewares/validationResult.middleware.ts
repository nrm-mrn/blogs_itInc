import { NextFunction, Request, Response } from "express";
import { FieldValidationError, ValidationError, validationResult } from "express-validator";
import { FieldError } from "../shared/types";

const formatErrors = (error: ValidationError): FieldError => {
  const expressError = error as unknown as FieldValidationError
  return {
    field: expressError.path,
    message: expressError.msg,
  }
}

export const inputValidationResultMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
    .formatWith(formatErrors)
    .array({ onlyFirstError: true })

  if (!errors.length) {
    next()
    return
  }

  res.status(400).send({ errorsMessages: errors })
  return;
}
