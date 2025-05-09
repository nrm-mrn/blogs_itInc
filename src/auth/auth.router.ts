import { Router } from "express"
import { container } from "../ioc"
import { AuthController } from "./api/auth"
import { requestsLimiter } from "../security/api/middleware/requestsLimiter.middleware"
import { loginInputValidation, newUserPasswordValidator, userEmailValidator, userRegistrationValidator } from "./api/middleware/auth.validators"
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware"
import { refreshTokenGuard } from "./guards/refreshTGuard"
import { jwtGuard } from "./guards/jwtGuard"

export const authRouter = Router({})

const authController = container.get(AuthController)

authRouter.post('/login',
  requestsLimiter,
  loginInputValidation,
  inputValidationResultMiddleware,
  authController.login.bind(authController)
)

authRouter.post('/refresh-token',
  refreshTokenGuard,
  authController.reissueTokens.bind(authController)
)

authRouter.post('/logout',
  refreshTokenGuard,
  authController.logout.bind(authController)
)

authRouter.get('/me',
  jwtGuard,
  authController.getUserInfo.bind(authController)
)

authRouter.post('/registration',
  requestsLimiter,
  userRegistrationValidator,
  inputValidationResultMiddleware,
  authController.registerUser.bind(authController)
)

authRouter.post('/registration-email-resending',
  requestsLimiter,
  userEmailValidator,
  inputValidationResultMiddleware,
  authController.resendEmailConfirmation.bind(authController)
)

authRouter.post('/registration-confirmation',
  requestsLimiter,
  inputValidationResultMiddleware,
  authController.confirmEmail.bind(authController)
)

authRouter.post('/password-recovery',
  requestsLimiter,
  userEmailValidator,
  inputValidationResultMiddleware,
  authController.recoverPassword.bind(authController)
)

authRouter.post('/new-password',
  requestsLimiter,
  newUserPasswordValidator,
  inputValidationResultMiddleware,
  authController.confirmPassword.bind(authController)
)
