import { NextFunction, Response } from "express";
import { ObjectId } from "../../shared/types/objectId.type";
import { PostsQueryRepository } from "../postsQuery.repository";
import { PagedResponse, PagingFilter, PagingQuery } from "../../shared/types/pagination.types";
import { PostsService } from "../posts.service";
import { RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithParamsAndQuery, RequestWithParamsBodyAndUserId, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { CommentInputModel, ICommentView, CreateCommentDto, GetCommentsDto } from "../../comments/comments.types";
import { CommentsService } from "../../comments/comments.service";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { GetPostCommentsSanitizedQuery, PostInputModel, IPostView } from "../posts.types";
import { CommentsQueryRepository } from "../../comments/commentsQuery.repository";
import { inject, injectable } from "inversify";
import mongoose from "mongoose";

@injectable()
export class PostsController {

  constructor(
    @inject(PostsQueryRepository)
    private readonly postsQueryRepo: PostsQueryRepository,
    @inject(PostsService)
    private readonly postsService: PostsService,
    @inject(CommentsService)
    private readonly commentsService: CommentsService,
    @inject(CommentsQueryRepository)
    private readonly commentsQueryRepo: CommentsQueryRepository
  ) { }

  async getAllPosts(req: RequestWithQuery<PagingQuery>, res: Response<PagedResponse<IPostView>>, next: NextFunction) {
    const paging = req.query as PagingFilter;
    try {
      const postsView = await this.postsQueryRepo.getAllPosts({ pagination: paging })
      res.status(200).send(postsView)
      return;
    } catch (err) {
      next(err)
    }
  }

  async createPost(req: RequestWithBody<PostInputModel>, res: Response<IPostView>, next: NextFunction) {
    try {
      const postId = await this.postsService.createPost(req.body);
      const postView = await this.postsQueryRepo.findPostById(postId);
      res.status(201).send(postView)
      return
    } catch (err) {
      next(err);
      return
    }
  }

  async getPost(req: RequestWithParams<IdType>, res: Response<IPostView>, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId
      const post = await this.postsQueryRepo.findPostById(id);
      res.status(200).send(post)
    } catch (err) {
      next(err)
    }
  }

  async editPost(req: RequestWithParamsAndBody<IdType, PostInputModel>, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as unknown as ObjectId;
      await this.postsService.editPost(id, req.body)
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  }

  async deletePost(req: RequestWithParams<IdType>, res: Response, next: NextFunction) {
    try {

      const id = req.params.id as unknown as ObjectId;
      await this.postsService.deletePost(id)
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  }

  async createCommentForPost(req: RequestWithParamsBodyAndUserId<{ id: string }, CommentInputModel, { id: string }>, res: Response<ICommentView>, next: NextFunction) {
    const postId = req.params.id as unknown as ObjectId;
    const userId = req.user!.id;
    const input: CreateCommentDto = {
      postId,
      userId,
      content: req.body.content,
    }
    try {
      const commentId = await this.commentsService.createComment(input);
      const comment = await this.commentsQueryRepo.getCommentById(commentId);
      res.status(HttpStatuses.Created).send(comment);
      return
    } catch (err) {
      next(err)
    }
  }

  async getCommentsForPost(req: RequestWithParamsAndQuery<{ id: string }, PagingQuery>, res: Response<PagedResponse<ICommentView>>, next: NextFunction) {
    const postId = req.params.id as unknown as ObjectId;
    const { ...pagination } = req.query as GetPostCommentsSanitizedQuery
    const dto: GetCommentsDto = {
      postId,
      paginator: pagination,
    }
    if (req.user?.id) {
      const userId = new mongoose.Types.ObjectId(req.user.id)
      dto.userId = userId
    }
    try {
      const data = await this.commentsQueryRepo.getComments(dto);
      res.status(HttpStatuses.Success).send(data);
      return
    } catch (err) {
      next(err)
    }
  }

}

