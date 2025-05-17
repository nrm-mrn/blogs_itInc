import { Router } from "express"
import { container } from "../ioc"
import { CommentsController } from "./api/comments"
import { paramObjectIdValidator } from "../shared/middlewares/shared.validators"
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware"
import { idToObjectId } from "../shared/shared.sanitizers"
import { jwtGuard } from "../auth/guards/jwtGuard"
import { commentContentValidator, likeStatusValidator } from "./api/middleware/comments.validators"
import { jwtOptionalGuard } from "../auth/guards/jwtOptionalGuard"

export const commentsRouter = Router({})

const commentsController = container.get(CommentsController)

commentsRouter.get('/:id',
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  jwtOptionalGuard,
  idToObjectId,
  commentsController.getCommentById.bind(commentsController)
)

commentsRouter.delete('/:id',
  jwtGuard,
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  commentsController.deleteComment.bind(commentsController)
)

commentsRouter.put('/:id',
  jwtGuard,
  paramObjectIdValidator,
  commentContentValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  commentsController.editComment.bind(commentsController)
)

commentsRouter.put('/:id/like-status',
  jwtGuard,
  likeStatusValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  commentsController.handleLike.bind(commentsController)
)
