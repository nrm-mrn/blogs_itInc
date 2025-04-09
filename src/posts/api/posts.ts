import { NextFunction, Response, Router } from "express";
import { baseAuthGuard } from "../../auth/guards/baseAuthGuard";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";
import { ObjectId } from "mongodb";
import { postsQueryRepository } from "../postsQuery.repository";
import { PagedResponse, PagingFilter, PagingQuery } from "../../shared/types/pagination.types";
import { postsService } from "../posts.service";
import { idToObjectId, paginationQuerySanitizerChain } from "../../shared/middlewares/shared.sanitizers";
import { RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithParamsAndQuery, RequestWithParamsBodyAndUserId, RequestWithQuery } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";
import { postInputValidator, postGetValidator, postUpdateValidator } from "./middleware/posts.validators";
import { jwtGuard } from "../../auth/guards/jwtGuard";
import { commentContentValidator } from "../../comments/api/middleware/comments.validators";
import { CommentInputModel, CommentViewModel, CreateCommentDto, GetCommentsDto } from "../../comments/comments.types";
import { commentsService } from "../../comments/comments.service";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { paramObjectIdValidator } from "../../shared/middlewares/shared.validators";
import { GetPostCommentsSanitizedQuery, PostInputModel, PostViewModel } from "../posts.types";
import { commentsQueryRepository } from "../../comments/commentsQuery.repository";


export const postsRouter = Router({})

postsRouter.get('/',
  paginationQuerySanitizerChain,
  async (req: RequestWithQuery<PagingQuery>, res: Response<PagedResponse<PostViewModel>>, next: NextFunction) => {
    const paging = req.query as PagingFilter;
    try {
      const postsView = await postsQueryRepository.getAllPosts({ pagination: paging })
      res.status(200).send(postsView)
      return;
    } catch (err) {
      next(err)
    }
  })

postsRouter.post('/',
  baseAuthGuard,
  postInputValidator,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<PostInputModel>, res: Response<PostViewModel>, next: NextFunction) => {
    const { post, error } = await postsService.createPost(req.body);
    if (!post) {
      res.sendStatus(400)
      return
    }
    res.status(201).send(post)
    return;
  })

postsRouter.get('/:id',
  postGetValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response<PostViewModel>) => {
    const id = req.params.id as unknown as ObjectId
    const post = await postsQueryRepository.findPostById(id);
    if (!post) {
      res.sendStatus(404);
      return;
    }
    res.status(200).send(post)
    return;
  })

postsRouter.put('/:id',
  baseAuthGuard,
  postUpdateValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsAndBody<IdType, PostInputModel>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const { error } = await postsService.editPost(id, req.body)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

postsRouter.delete('/:id',
  baseAuthGuard,
  idToObjectId,
  async (req: RequestWithParams<IdType>, res: Response) => {
    const id = req.params.id as unknown as ObjectId;
    const { error } = await postsService.deletePost(id)
    if (error) {
      res.sendStatus(404);
      return;
    }
    res.sendStatus(204)
    return
  })

postsRouter.post('/:id/comments',
  jwtGuard,
  paramObjectIdValidator,
  commentContentValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsBodyAndUserId<{ id: string }, CommentInputModel, { id: string }>, res: Response<CommentViewModel>, next: NextFunction) => {
    const postId = req.params.id as unknown as ObjectId;
    const userId = req.user!.id;
    const input: CreateCommentDto = {
      postId,
      userId,
      content: req.body.content,
    }
    try {
      const { data } = await commentsService.createComment(input);
      res.status(HttpStatuses.Created).send(data);
      return
    } catch (err) {
      next(err)
    }
  })

postsRouter.get('/:id/comments',
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  paginationQuerySanitizerChain,
  idToObjectId,
  async (req: RequestWithParamsAndQuery<{ id: string }, PagingQuery>, res: Response<PagedResponse<CommentViewModel>>, next: NextFunction) => {
    const postId = req.params.id as unknown as ObjectId;
    const { ...pagination } = req.query as GetPostCommentsSanitizedQuery
    const dto: GetCommentsDto = {
      postId,
      paginator: pagination,
    }
    try {
      const data = await commentsQueryRepository.getComments(dto);
      res.status(HttpStatuses.Success).send(data);
      return
    } catch (err) {
      next(err)
    }
  }
)
