import { Router } from "express"
import { container } from "../ioc"
import { BlogsController } from "./api/blogs"
import { getBlogsSanitizerChain } from "./api/middleware/blogs.sanitizers"
import { baseAuthGuard } from "../auth/guards/baseAuthGuard"
import { blogGetValidation, blogInputValidation, blogUpdateValidation } from "./api/middleware/blogs.validators"
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware"
import { idToObjectId } from "../shared/shared.sanitizers"
import { paginationQuerySanitizerChain } from "../shared/middlewares/shared.sanitizers"
import { postInputValidator } from "../posts/api/middleware/posts.validators"

export const blogsRouter = Router({})

const blogsController = container.get(BlogsController)

blogsRouter.get('/',
  getBlogsSanitizerChain,
  blogsController.getAllBlogs.bind(blogsController)
)

blogsRouter.post('/',
  baseAuthGuard,
  blogInputValidation,
  inputValidationResultMiddleware,
  blogsController.createBlog.bind(blogsController)
)

blogsRouter.get('/:id',
  blogGetValidation,
  inputValidationResultMiddleware,
  idToObjectId,
  blogsController.getBlog.bind(blogsController)
)

blogsRouter.get('/:id/posts',
  blogGetValidation,
  inputValidationResultMiddleware,
  paginationQuerySanitizerChain,
  idToObjectId,
  blogsController.getBlogPosts.bind(blogsController)
)

blogsRouter.post('/:id/posts',
  baseAuthGuard,
  blogGetValidation,
  postInputValidator,
  inputValidationResultMiddleware,
  idToObjectId,
  blogsController.createPostForBlog.bind(blogsController)

)

blogsRouter.put('/:id',
  baseAuthGuard,
  blogUpdateValidation,
  inputValidationResultMiddleware,
  idToObjectId,
  blogsController.editBlog.bind(blogsController)
)

blogsRouter.delete('/:id',
  baseAuthGuard,
  idToObjectId,
  blogsController.deleteBlog.bind(blogsController)
)

