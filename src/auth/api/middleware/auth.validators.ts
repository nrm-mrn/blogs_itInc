import { body } from "express-validator";

const loginOrEmailValidator = body('loginOrEmail')
  .isString().withMessage('login or email should be string')
  .trim()
  .notEmpty().withMessage('login or email should not be empty')

const passwordValidator = body('password')
  .isString().withMessage('Password should be string')
  .trim()
  .notEmpty().withMessage('Password should not be empty')


export const loginInputValidation = [
  loginOrEmailValidator,
  passwordValidator,
]
