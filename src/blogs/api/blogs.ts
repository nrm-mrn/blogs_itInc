import { NextFunction, Response } from "express";
import { ObjectId } from "../../shared/types/objectId.type";
import { BlogService } from "../blogs.service";
import { BlogQueryRepository } from "../blogsQuery.repository";
import { GetBlogsQuery, GetBlogsDto, GetBlogsSanitizedQuery, BlogInputModel, IBlogView, GetBlogPostsDto } from "../blogs.types";
import { APIErrorResult } from "../../shared/types/error.types";
import { PagedResponse, PagingFilter, PagingQuery } from "../../shared/types/pagination.types";
import { RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithParamsAndQuery, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { IPostView, BlogPostInputModel } from "../../posts/posts.types";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inject } from "inversify";
import { PostsQueryRepository } from "../../posts/postsQuery.repository";

export class BlogsController {
  constructor(
    @inject(BlogService)
    private readonly blogService: BlogService,
    @inject(BlogQueryRepository)
    private readonly blogQueryRepo: BlogQueryRepository,
    @inject(PostsQueryRepository)
    private readonly postQueryRepo: PostsQueryRepository
  ) { };

  async getAllBlogs(req: RequestWithQuery<GetBlogsQuery>, res: Response<PagedResponse<IBlogView>>, next: NextFunction) {
    try {
      const { searchNameTerm, ...rest } = req.query as GetBlogsSanitizedQuery;
      const dto: GetBlogsDto = {
        searchNameTerm: searchNameTerm,
        pagination: { ...rest }
      }
      const blogsPage = await this.blogQueryRepo.getAllBlogs(dto)
      res.status(200).send(blogsPage)
      return;
    } catch (err) {
      next(err)
    }
  }

  async createBlog(req: RequestWithBody<BlogInputModel>, res: Response<IBlogView>, next: NextFunction) {
    try {
      const { blogId } = await this.blogService.createBlog(req.body);
      const blog = await this.blogQueryRepo.findBlog(blogId);
      if (!blog) {
        throw new Error('Could not find created blog')
      }
      res
        .status(HttpStatuses.Created)
        .send(blog)
      return;
    }
    catch (err) {
      next(err)
    }
  }

  async getBlog(req: RequestWithParams<IdType>, res: Response<IBlogView>, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId
      const blog = await this.blogQueryRepo.findBlog(id);
      res.status(200).send(blog)
      return
    } catch (err) {
      next(err)
    }
  }

  async getBlogPosts(req: RequestWithParamsAndQuery<IdType, PagingQuery>, res: Response<PagedResponse<IPostView>>, next: NextFunction) {
    try {
      const postsDto: GetBlogPostsDto = {
        blogId: req.params.id as unknown as ObjectId,
        pagination: req.query as PagingFilter,
      }
      const posts = await this.blogQueryRepo.getBlogPosts(postsDto)
      res.status(200).send(posts)
    } catch (err) {
      next();
    }
  }

  async createPostForBlog(req: RequestWithParamsAndBody<IdType, BlogPostInputModel>, res: Response<IPostView | APIErrorResult>, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId
      const postInput: BlogPostInputModel = req.body
      const postId = await this.blogService.createPostForBlog(id, postInput)
      const post = await this.postQueryRepo.findPostById(postId)
      res.status(201).send(post)
    } catch (err) {
      next(err)
    }
  }

  async editBlog(req: RequestWithParamsAndBody<IdType, BlogInputModel>, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId
      await this.blogService.editBlog(id, req.body)
      res.sendStatus(204)
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async deleteBlog(req: RequestWithParams<IdType>, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId
      await this.blogService.deleteBlog(id)
      res.sendStatus(204)
      return
    } catch (err) {
      next(err)
      return;
    }
  }
}

