import { body, param } from "express-validator";
import { ObjectId } from "mongodb";

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

const blogIdValidator = param('id')
  .custom((postId: string) => {
    const isValidId = ObjectId.isValid(postId)
    if (!isValidId) {
      throw new Error('Invalid id param')
    }
    return true
  })

export const blogGetValidation = [
  blogIdValidator
]

export const blogInputValidation = [
  blogNameValidator,
  blogDescrValidator,
  blogWebsiteUrlValidator,
]

export const blogUpdateValidation = [
  blogIdValidator,
  blogNameValidator,
  blogDescrValidator,
  blogWebsiteUrlValidator,
]
