import { body } from "express-validator";
import { paramObjectIdValidator } from "../../../shared/middlewares/shared.validators";

const blogNameValidator = body('name')
  .isString().withMessage('Name should be string')
  .trim()
  .notEmpty().withMessage('Name should not be empty')
  .isLength({ max: 15 }).withMessage('Name should not be longer than 15 symbols')

const blogDescrValidator = body('description')
  .isString().withMessage('Description should be string')
  .trim()
  .notEmpty().withMessage('Description should not be empty')
  .isLength({ max: 500 }).withMessage('Description should be 500 characters max')

const blogWebsiteUrlValidator = body('websiteUrl')
  .isString().withMessage('Website url should be string')
  .trim()
  .notEmpty().withMessage('Url should not be empty')
  .isLength({ max: 100 }).withMessage('Url should be 100 characters max')
  .matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/)
  .withMessage('Website url should be a valid url');

export const blogGetValidation = [
  paramObjectIdValidator
]

export const blogInputValidation = [
  blogNameValidator,
  blogDescrValidator,
  blogWebsiteUrlValidator,
]

export const blogUpdateValidation = [
  paramObjectIdValidator,
  blogNameValidator,
  blogDescrValidator,
  blogWebsiteUrlValidator,
]
