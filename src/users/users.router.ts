import { Router } from "express"
import { container } from "../ioc"
import { UsersController } from "./api/users"
import { baseAuthGuard } from "../auth/guards/baseAuthGuard"
import { usersQuerySanChain } from "./api/middleware/users.sanitizers"
import { userInputValidator } from "./api/middleware/users.validators"
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware"
import { idToObjectId } from "../shared/shared.sanitizers"

export const usersRouter = Router({})

const usersController = container.get(UsersController)

usersRouter.get('/',
  baseAuthGuard,
  usersQuerySanChain,
  usersController.getAllUsers.bind(usersController)
)

usersRouter.post('/',
  baseAuthGuard,
  userInputValidator,
  inputValidationResultMiddleware,
  usersController.createUser.bind(usersController)
)

usersRouter.delete('/:id',
  baseAuthGuard,
  idToObjectId,
  usersController.deleteUser.bind(usersController)
)

