import { NextFunction, Response, Router } from "express";
import { RequestWithParams, RequestWithParamsAndUserId, RequestWithParamsBodyAndUserId } from "../../shared/types/requests.types";
import { commentContentValidator } from "./middleware/comments.validators";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";
import { jwtGuard } from "../../auth/guards/jwtGuard";
import { CommentInputModel, CommentViewModel, DeleteCommentDto, UpdateCommentDto } from "../comments.types";
import { idToObjectId } from "../../shared/shared.sanitizers";
import { ObjectId } from "mongodb";
import { commentsQueryRepository } from "../commentsQuery.repository";
import { commentsService } from "../comments.service";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { paramObjectIdValidator } from "../../shared/middlewares/shared.validators";


export const commentsRouter = Router({})

commentsRouter.get('/:id',
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParams<{ id: string }>, res: Response<CommentViewModel>, next: NextFunction) => {
    const id = req.params.id as unknown as ObjectId;
    try {
      const { data } = await commentsQueryRepository.getCommentById(id);
      res.status(HttpStatuses.Success).send(data);
      return
    } catch (err) {
      next(err)
    }
  })

commentsRouter.delete('/:id',
  jwtGuard,
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsAndUserId<{ id: string }, { id: string }>, res: Response, next: NextFunction) => {
    const postId = req.params.id as unknown as ObjectId;
    const userId = req.user!.id
    const dto: DeleteCommentDto = { id: postId, userId }
    try {
      await commentsService.deleteComment(dto)
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
    }
  })

commentsRouter.put('/:id',
  jwtGuard,
  paramObjectIdValidator,
  commentContentValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  async (req: RequestWithParamsBodyAndUserId<{ id: string }, CommentInputModel, { id: string }>, res: Response, next: NextFunction) => {
    const id = req.params.id as unknown as ObjectId;
    const userId = req.user!.id
    const dto: UpdateCommentDto = {
      id,
      userId,
      content: req.body.content
    }
    try {
      await commentsService.updateComment(dto);
      res.sendStatus(204)
      return
    } catch (err) {
      next(err)
    }
  })
