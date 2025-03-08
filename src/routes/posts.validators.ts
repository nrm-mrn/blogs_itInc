import { body } from "express-validator";

const postTitleValidator = body('title')
  .notEmpty().withMessage('Title should not be empty')
  .isString().withMessage('Title should be string')
  .trim()
  .isLength({ max: 30 }).withMessage('Title should not be longer than 30 symbols')

const postDescrValidator = body('shortDescription')
  .notEmpty().withMessage('Description should not be empty')
  .isString().withMessage('Description should be string')
  .trim()
  .isLength({ max: 100 }).withMessage('Description should be 100 characters max')

const postContentValidator = body('content')
  .notEmpty().withMessage('Body should not be empty')
  .isString().withMessage('Content should be string')
  .trim()
  .isLength({ max: 1000 })
  .withMessage('Content should be 1000 characters max');


export const postInputValidator = [
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
]
