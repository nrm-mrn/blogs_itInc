import { Router } from "express"
import { container } from "../ioc"
import { PostsController } from "./api/posts"
import { paginationQuerySanitizerChain } from "../shared/middlewares/shared.sanitizers";
import { baseAuthGuard } from "../auth/guards/baseAuthGuard";
import { postGetValidator, postInputValidator, postUpdateValidator } from "./api/middleware/posts.validators";
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware";
import { idToObjectId } from "../shared/shared.sanitizers";
import { jwtGuard } from "../auth/guards/jwtGuard";
import { paramObjectIdValidator } from "../shared/middlewares/shared.validators";
import { commentContentValidator } from "../comments/api/middleware/comments.validators";

export const postsRouter = Router({})

const postsController = container.get(PostsController);

postsRouter.get('/',
  paginationQuerySanitizerChain,
  postsController.getAllPosts.bind(postsController)
)

postsRouter.post('/',
  baseAuthGuard,
  postInputValidator,
  inputValidationResultMiddleware,
  postsController.createPost.bind(postsController)
)

postsRouter.get('/:id',
  postGetValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  postsController.getPost.bind(postsController)
)

postsRouter.put('/:id',
  baseAuthGuard,
  postUpdateValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  postsController.editPost.bind(postsController)
)

postsRouter.delete('/:id',
  baseAuthGuard,
  idToObjectId,
  postsController.deletePost.bind(postsController)
)

postsRouter.post('/:id/comments',
  jwtGuard,
  paramObjectIdValidator,
  commentContentValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  postsController.createCommentForPost.bind(postsController)
)

postsRouter.get('/:id/comments',
  paramObjectIdValidator,
  inputValidationResultMiddleware,
  paginationQuerySanitizerChain,
  idToObjectId,
  postsController.getCommentsForPost.bind(postsController)
)
