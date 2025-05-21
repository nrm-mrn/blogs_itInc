import { body } from "express-validator";
import { paramObjectIdValidator } from "../../../shared/middlewares/shared.validators";
import { PostLikeStatus } from "../../application/posts.dto";

const postTitleValidator = body('title')
  .isString().withMessage('Title should be string')
  .trim()
  .notEmpty().withMessage('Title should not be empty')
  .isLength({ max: 30 }).withMessage('Title should not be longer than 30 symbols')

const postDescrValidator = body('shortDescription')
  .isString().withMessage('Description should be string')
  .trim()
  .notEmpty().withMessage('Description should not be empty')
  .isLength({ max: 100 }).withMessage('Description should be 100 characters max')

const postContentValidator = body('content')
  .isString().withMessage('Content should be string')
  .trim()
  .notEmpty().withMessage('Body should not be empty')
  .isLength({ max: 1000 })
  .withMessage('Content should be 1000 characters max');

export const postLikeStatusValidator = body('likeStatus')
  .isIn(Object.values(PostLikeStatus))
  .withMessage('Like status should be valid')

export const postGetValidator = [
  paramObjectIdValidator
]

export const postInputValidator = [
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
]

export const postUpdateValidator = [
  paramObjectIdValidator,
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
]
