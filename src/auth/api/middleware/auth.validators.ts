import { body } from "express-validator";

const loginOrEmailValidator = body('loginOrEmail')
  .isString().withMessage('login or email should be string')
  .trim()
  .notEmpty().withMessage('login or email should not be empty')

export const passwordValidator = body('password')
  .isString().withMessage('Password should be string')
  .trim()
  .notEmpty().withMessage('Password should not be empty')

const userLoginValidator = body('login')
  .isString().withMessage('Login should be string')
  .trim()
  .notEmpty().withMessage('Login should not be empty')
  .isLength({ min: 3, max: 10 }).withMessage('Login should be 3-10 symbols')

const userPasswordValidator = body('password')
  .isString().withMessage('Password should be string')
  .trim()
  .notEmpty().withMessage('Password should not be empty')
  .isLength({ min: 6, max: 20 }).withMessage('Description should be 100 characters max')

export const newUserPasswordValidator = body('newPassword')
  .isString().withMessage('Password should be string')
  .trim()
  .notEmpty().withMessage('Password should not be empty')
  .isLength({ min: 6, max: 20 }).withMessage('Description should be 100 characters max')

export const userEmailValidator = body('email')
  .trim()
  .notEmpty().withMessage('Email should not be empty')
  .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  .withMessage('Email is not valid')

export const userRegistrationValidator = [
  userLoginValidator,
  userEmailValidator,
  userPasswordValidator,
]

export const loginInputValidation = [
  loginOrEmailValidator,
  passwordValidator,
]
