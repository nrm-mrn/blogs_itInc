import { body } from "express-validator";
import { blogRepository } from "../repositories/blogs.repository";

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
  .isString().withMessage('BlogId should be string')
  .trim()
  .notEmpty().withMessage('BlogId should not be empty')
  .custom(async (blogId: string) => {
    const target = await blogRepository.findBlog(blogId);
    if (!target) {
      throw new Error('blog with specified blogId does not exist')
    }
    return true
  })


export const postInputValidator = [
  postTitleValidator,
  postDescrValidator,
  postContentValidator,
  postBlogIdValidator,
]
