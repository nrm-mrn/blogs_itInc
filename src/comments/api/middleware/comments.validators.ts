import { body } from "express-validator";
import { LikeStatus } from "../../commentLike.entity";


export const commentContentValidator = body('content')
  .isString().withMessage('Content should be string')
  .trim()
  .isLength({ min: 20, max: 300 }).withMessage('Comment should be 20-300 characters')

export const likeStatusValidator = body('likeStatus')
  .isIn(Object.values(LikeStatus))
  .withMessage('Like status should be Like, Dislike or None')
