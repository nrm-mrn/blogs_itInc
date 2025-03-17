import { Request, Response, Router } from "express";
import { BlogInputModel, BlogViewModel } from "../db/db-types";
import { blogRepository } from "../repositories/blogs.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { blogGetValidation, blogInputValidation, blogUpdateValidation } from "./blogs.validators";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";
import { param } from "express-validator";
import { ObjectId } from "mongodb";


export const blogsRouter = Router({})

blogsRouter.get('/', async (req: Request, res: Response) => {
  const blogs = await blogRepository.getAllBlogs()
  const blogsView: BlogViewModel[] = blogs.map(blog => {
    const { _id, ...rest } = blog
    return { id: _id, ...rest }
  })
  res.status(200).send(blogsView)
  return;
})

blogsRouter.post('/',
  authMiddleware,
  blogInputValidation,
  inputValidationResultMiddleware,
  async (req: Request<any, any, BlogInputModel>, res: Response<BlogViewModel>) => {
    const { newBlog, error } = await blogRepository.createBlog(req.body);
    const { _id, ...rest } = newBlog!;
    const newBlogView: BlogViewModel = { id: _id, ...rest }
    res.status(201).send(newBlogView)
    return;
  })

blogsRouter.get('/:id',
  blogGetValidation,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response<BlogViewModel>) => {
    const id = req.params.id as unknown as ObjectId
    const blog = await blogRepository.findBlog(id);
    if (!blog) {
      res.sendStatus(404);
      return;
    }
    const { _id, ...rest } = blog;
    const blogView: BlogViewModel = { id: _id, ...rest };
    res.status(200).send(blogView)
    return;
  })

blogsRouter.put('/:id',
  authMiddleware,
  blogUpdateValidation,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }, any, BlogInputModel, any>, res: Response) => {
    const id = req.params.id as unknown as ObjectId
    const result = await blogRepository.editBlog(id, req.body)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

blogsRouter.delete('/:id',
  authMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response) => {
    const id = req.params.id as unknown as ObjectId
    const result = await blogRepository.deleteBlog(id)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

