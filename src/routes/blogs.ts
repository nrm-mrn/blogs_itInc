import { Request, Response, Router } from "express";
import { db } from "../db/db";
import { BlogInputModel, BlogViewModel } from "../db/db-types";
import { blogRepository } from "../repositories/blogs.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { blogInputValidation } from "./blogs.validators";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";


export const blogsRouter = Router({})

blogsRouter.get('/', (req: Request, res: Response) => {
  const blogs = db.blogs;
  res.status(200).send(blogs)
  return;
})

blogsRouter.post('/',
  authMiddleware,
  blogInputValidation,
  inputValidationResultMiddleware,
  async (req: Request<any, any, BlogInputModel>, res: Response<BlogViewModel>) => {
    const { blog, error } = await blogRepository.createBlog(req.body);
    res.status(201).send(blog!)
    return;
  })

blogsRouter.get('/:id', async (req: Request<{ 'id': string }>, res: Response<BlogViewModel>) => {
  const blog = await blogRepository.findBlog(req.params.id);
  if (!blog) {
    res.sendStatus(404);
    return;
  }
  res.status(200).send(blog)
  return;
})

blogsRouter.put('/:id',
  authMiddleware,
  blogInputValidation,
  inputValidationResultMiddleware,
  async (req: Request<{ 'id': string }, any, BlogInputModel>, res: Response) => {
    const result = await blogRepository.editBlog(req.params.id, req.body)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

blogsRouter.delete('/:id',
  authMiddleware,
  async (req: Request<{ 'id': string }>, res: Response) => {
    const result = await blogRepository.deleteBlog(req.params.id)
    if (result?.error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

