import { Response, Router } from "express";
import { baseAuthGuard } from "../../auth/guards/baseAuthGuard";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";
import { ObjectId } from "mongodb";
import { blogService } from "../blogs.service";
import { postInputValidator } from "../../posts/api/middleware/posts.validators";
import { blogQueryRepository } from "../blogsQuery.repository";
import { GetBlogsQuery, GetBlogsDto, GetBlogsSanitizedQuery, BlogInputModel, BlogViewModel } from "../blogs.types";
import { APIErrorResult } from "../../shared/types/error.types";
import { PagedResponse, PagingFilter, PagingQuery } from "../../shared/types/pagination.types";
import { RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithParamsAndQuery, RequestWithQuery } from "../../shared/types/requests.types";
import { idToObjectId, paginationQuerySanitizerChain } from "../../shared/middlewares/shared.sanitizers";
import { IdType } from "../../shared/types/id.type";
import { getBlogsSanitizerChain } from "./middleware/blogs.sanitizers";
import { blogInputValidation, blogGetValidation, blogUpdateValidation } from "./middleware/blogs.validators";
import { PostViewModel, BlogPostInputModel } from "../../posts/posts.types";


export const blogsRouter = Router({})

blogsRouter.get('/',
  getBlogsSanitizerChain,
  async (req: RequestWithQuery<GetBlogsQuery>, res: Response<PagedResponse<BlogViewModel>>) => {
    const { searchNameTerm, ...rest } = req.query as GetBlogsSanitizedQuery;
    const dto: GetBlogsDto = {
      searchNameTerm: searchNameTerm,
      pagination: { ...rest }
    }
    const blogsPage = await blogQueryRepository.getAllBlogs(dto)
    res.status(200).send(blogsPage)
    return;
  })

blogsRouter.post('/',
  baseAuthGuard,
  blogInputValidation,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<BlogInputModel>, res: Response<BlogViewModel | string>) => {
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
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response<BlogViewModel>) => {
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
  inputValidationResultMiddleware,
  paginationQuerySanitizerChain,
  idToObjectId,
  async (req: RequestWithParamsAndQuery<IdType, PagingQuery>, res: Response<PagedResponse<PostViewModel>>) => {
    const id = req.params.id as unknown as ObjectId
    const paging = req.query as PagingFilter
    const { data: postsPage, error } = await blogQueryRepository.getBlogPosts({ blogId: id, pagination: { ...paging } })
    if (!postsPage) {
      res.sendStatus(404);
      return
    }
    res.status(200).send(postsPage)
  }
)

blogsRouter.post('/:id/posts',
  baseAuthGuard,
  blogGetValidation,
  postInputValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsAndBody<IdType, BlogPostInputModel>, res: Response<PostViewModel | APIErrorResult>) => {
    const id = req.params.id as unknown as ObjectId
    const postInput: BlogPostInputModel = req.body
    const { post, error } = await blogService.createPostForBlog(id, postInput)
    if (!post) {
      res.sendStatus(404);
      return
    }
    res.status(201).send(post)
  }

)

blogsRouter.put('/:id',
  baseAuthGuard,
  blogUpdateValidation,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsAndBody<IdType, BlogInputModel>, res: Response) => {
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
  baseAuthGuard,
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response) => {
    const id = req.params.id as unknown as ObjectId
    const { error } = await blogService.deleteBlog(id)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

