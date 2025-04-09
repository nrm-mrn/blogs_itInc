import { NextFunction, Response, Router } from "express";
import { RequestWithBody, RequestWithUserId } from "../../shared/types/requests.types";
import { loginInputValidation } from "./middleware/auth.validators";
import { LoginBody, LoginDto, MeView } from "../auth.types";
import { authService } from "../auth.service";
import { jwtGuard } from "../guards/jwtGuard";
import { ObjectId } from "mongodb";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";


export const authRouter = Router({})

authRouter.post('/login',
  loginInputValidation,
  inputValidationResultMiddleware,
  async (req: RequestWithBody<LoginBody>, res: Response<{ accessToken: string }>, next: NextFunction) => {
    const creds: LoginDto = req.body;
    try {
      const token = await authService.checkCredentials(creds)
      res.status(HttpStatuses.Success).send(token)
      return
    } catch (err) {
      next(err)
      return
    }
  })

authRouter.get('/me',
  jwtGuard,
  async (req: RequestWithUserId<{ id: string }>, res: Response<MeView>, next: NextFunction) => {
    const userId = new ObjectId(req.user!.id)
    try {
      const { data } = await authService.getUserInfo(userId)
      res.status(HttpStatuses.Success).send(data)
      return
    } catch (err) {
      next(err)
      return
    }
  }
)
