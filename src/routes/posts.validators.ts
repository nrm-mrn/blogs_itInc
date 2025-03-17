import { body, param } from "express-validator";
import { blogRepository } from "../repositories/blogs.repository";
import { ObjectId } from "mongodb";

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

const postBlogIdValidator = body('blogId')
  .trim()
  .notEmpty().withMessage('BlogId should not be empty')
  .custom(async (blogId: string) => {
    const isValidId = ObjectId.isValid((blogId))
    if (!isValidId) {
      throw new Error('Not valid blogId')
    }
    const target = await blogRepository.findBlog(new ObjectId(blogId));
    if (!target) {
      throw new Error('blog with specified blogId does not exist')
    }
    return true
  })

const postIdValidator = param('id')
  .custom((postId: string) => {
    const isValidId = ObjectId.isValid(postId)
    if (!isValidId) {
      throw new Error('Invalid id param')
    }
    return true
  })

export const postGetValidator = [
  postIdValidator
]

export const postInputValidator = [
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
  postBlogIdValidator,
]

export const postUpdateValidator = [
  postIdValidator,
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
]
