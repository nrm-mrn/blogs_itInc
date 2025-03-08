import { body } from "express-validator";

const blogNameValidator = body('name')
  .notEmpty().withMessage('Name should not be empty')
  .isString().withMessage('Name should be string')
  .trim()
  .isLength({ max: 15 }).withMessage('Name should not be longer than 15 symbols')

const blogDescrValidator = body('description')
  .notEmpty().withMessage('Description should not be empty')
  .isString().withMessage('Description should be string')
  .trim()
  .isLength({ max: 500 }).withMessage('Description should be 500 characters max')

const blogWebsiteUrlValidator = body('websiteUrl')
  .notEmpty().withMessage('Url should not be empty')
  .isString().withMessage('Website url should be string')
  .isLength({ max: 100 }).withMessage('Url should be 100 characters max')
  .matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/)
  .withMessage('Website url should be a valid url');


export const blogInputValidation = [
  blogNameValidator,
  blogDescrValidator,
  blogWebsiteUrlValidator,
]
