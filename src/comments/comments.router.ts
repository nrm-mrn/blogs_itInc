import { Router } from "express"
import { container } from "../ioc"
import { CommentsController } from "./api/comments"
import { paramObjectIdValidator } from "../shared/middlewares/shared.validators"
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware"
import { idToObjectId } from "../shared/shared.sanitizers"
import { jwtGuard } from "../auth/guards/jwtGuard"
import { commentContentValidator } from "./api/middleware/comments.validators"

export const commentsRouter = Router({})

const commentsController = container.get(CommentsController)

commentsRouter.get('/:id',
  paramObjectIdValidator,
  inputValidationResultMiddleware,
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
