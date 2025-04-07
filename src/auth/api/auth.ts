import { Response, Router } from "express";
import { RequestWithBody } from "../../shared/types/requests.types";
import { loginInputValidation } from "./middleware/auth.validators";
import { LoginBody, LoginDto } from "../auth.types";
import { authService } from "../auth.service";


export const authRouter = Router({})

authRouter.get('/login',
  loginInputValidation,
  async (req: RequestWithBody<LoginBody>, res: Response) => {
    const creds: LoginDto = req.body;
    try {
      const credsValid = await authService.checkCredentials(creds)
      if (credsValid) {
        res.sendStatus(204)
        return
      }
      res.sendStatus(401)
      return;
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'User not found') {
          res.sendStatus(401)
          return
        }
      }
      res.sendStatus(400)
      return
    }
  })

