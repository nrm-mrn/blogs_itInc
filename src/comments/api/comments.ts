import { NextFunction, Response } from "express";
import { RequestWithParams, RequestWithParamsAndBody, RequestWithParamsAndUserId, RequestWithParamsBodyAndUserId } from "../../shared/types/requests.types";
import { CommentInputModel, ICommentView, DeleteCommentDto, UpdateCommentDto, LikeInputModel, LikeInputDto } from "../comments.types";
import { ObjectId } from "../../shared/types/objectId.type";
import { CommentsQueryRepository } from "../commentsQuery.repository";
import { CommentsService } from "../comments.service";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inject, injectable } from "inversify";
import mongoose from "mongoose";


@injectable()
export class CommentsController {

  constructor(
    @inject(CommentsQueryRepository)
    private readonly commentsQueryRepo: CommentsQueryRepository,
    @inject(CommentsService)
    private readonly commentsService: CommentsService
  ) { }

  async getCommentById(req: RequestWithParams<{ id: string }>, res: Response<ICommentView>, next: NextFunction) {
    const id = req.params.id as unknown as ObjectId;
    let userId
    if (req.user?.id) {
      userId = new mongoose.Types.ObjectId(req.user.id)
    }
    try {
      const data = await this.commentsQueryRepo.getCommentById(id, userId);
      res.status(HttpStatuses.Success).send(data);
      return
    } catch (err) {
      next(err)
    }
  }

  async deleteComment(req: RequestWithParamsAndUserId<{ id: string }, { id: string }>, res: Response, next: NextFunction) {
    const postId = req.params.id as unknown as ObjectId;
    const userId = req.user!.id
    const dto: DeleteCommentDto = { id: postId, userId }
    try {
      await this.commentsService.deleteComment(dto)
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
    }
  }

  async editComment(req: RequestWithParamsBodyAndUserId<{ id: string }, CommentInputModel, { id: string }>, res: Response, next: NextFunction) {
    const id = req.params.id as unknown as ObjectId;
    const userId = req.user!.id
    const dto: UpdateCommentDto = {
      id,
      userId,
      content: req.body.content
    }
    try {
      await this.commentsService.updateComment(dto);
      res.sendStatus(204)
      return
    } catch (err) {
      next(err)
    }
  }

  async handleLike(req: RequestWithParamsBodyAndUserId<{ id: string }, LikeInputModel, { id: string }>,
    res: Response, next: NextFunction) {
    const commentId = req.params.id as unknown as ObjectId;
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const dto: LikeInputDto = {
      commentId,
      userId,
      status: req.body.likeStatus
    }
    try {
      await this.commentsService.handleCommentLike(dto);
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
    }
  }
}

