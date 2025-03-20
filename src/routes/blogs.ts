import { Request, Response, Router } from "express";
import { BlogInputModel, BlogViewModel, PostInputModel, PostViewModel } from "../db/db-types";
import { authMiddleware } from "../middlewares/auth.middleware";
import { blogGetValidation, blogInputValidation, blogUpdateValidation } from "./blogs.validators";
import { inputValidationResultMiddleware } from "../middlewares/validationResult.middleware";
import { param } from "express-validator";
import { ObjectId } from "mongodb";
import { APIErrorResult, GetBlogsDto, GetBlogsQuery, PagedResponse, PagingParams } from "../shared/types";
import { querySanitizerChain } from "./shared.validators";
import { blogService } from "../domain/blogs.service";
import { postInputValidator } from "./posts.validators";
import { blogQueryRepository } from "../repositories/blogsQuery.repository";


export const blogsRouter = Router({})

blogsRouter.get('/',
  querySanitizerChain,
  async (req: Request<{}, any, {}, GetBlogsQuery>, res: Response<PagedResponse<BlogViewModel>>) => {
    const { searchNameTerm, ...rest } = req.query
    const dto: GetBlogsDto = { searchNameTerm, pagination: { ...rest } }
    const blogsPage = await blogQueryRepository.getAllBlogs(dto)
    res.status(200).send(blogsPage)
    return;
  })

blogsRouter.post('/',
  authMiddleware,
  blogInputValidation,
  inputValidationResultMiddleware,
  async (req: Request<any, any, BlogInputModel>, res: Response<BlogViewModel | string>) => {
    const { newBlog, error } = await blogService.createBlog(req.body);
    if (!error) {
      res.status(201).send(newBlog!)
      return;
    }
    res.status(500).send(error)
  })

blogsRouter.get('/:id',
  blogGetValidation,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }>, res: Response<BlogViewModel>) => {
    const id = req.params.id as unknown as ObjectId
    const blog = await blogQueryRepository.findBlog(id);
    if (!blog) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(blog)
    return;
  })

blogsRouter.get('/:id/posts',
  blogGetValidation,
  querySanitizerChain,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ id: string }, any, {}, PagingParams>, res: Response<PagedResponse<PostViewModel>>) => {
    const id = req.params.id as unknown as ObjectId
    const { data: postsPage, error } = await blogQueryRepository.getBlogPosts({ blogId: id, pagination: { ...req.query } })
    if (!postsPage) {
      res.sendStatus(404);
      return
    }
    res.status(200).send(postsPage)
  }
)

blogsRouter.post('/:id/posts',
  authMiddleware,
  blogGetValidation,
  postInputValidator,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ id: string }, any, PostInputModel, any>, res: Response<PostViewModel | APIErrorResult>) => {
    //implement possibly using postsService
  }

)

blogsRouter.put('/:id',
  authMiddleware,
  blogUpdateValidation,
  inputValidationResultMiddleware,
  param('id').customSanitizer(id => new ObjectId(id)),
  async (req: Request<{ 'id': string }, any, BlogInputModel, any>, res: Response) => {
    const id = req.params.id as unknown as ObjectId
    const { error } = await blogService.editBlog(id, req.body)
    if (error) {
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
    const { error } = await blogService.deleteBlog(id)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

