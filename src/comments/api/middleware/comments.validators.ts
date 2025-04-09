import { body } from "express-validator";


export const commentContentValidator = body('content')
  .isString().withMessage('Content should be string')
  .trim()
  .isLength({ min: 20, max: 300 }).withMessage('Comment should be 20-300 characters')
