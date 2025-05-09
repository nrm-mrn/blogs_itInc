import { NextFunction, Request, Response } from "express";
import { RequestWithBody, RequestWithUserId } from "../../shared/types/requests.types";
import { LoginBody, LoginDto, MeView, PassRecoveryBody } from "../auth.types";
import { AuthService } from "../auth.service";
import { ObjectId } from "mongodb";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { UserInputModel } from "../../users/user.types";
import { SETTINGS } from "../../settings/settings";
import { SessionsService } from "../../security/sessions.service";
import { UsersQueryRepository } from "../../users/usersQuery.repository";
import { inject, injectable } from "inversify";


@injectable()
export class AuthController {
  constructor(
    @inject(AuthService)
    private readonly authService: AuthService,
    @inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @inject(UsersQueryRepository)
    private readonly usersQueryRepo: UsersQueryRepository,
  ) { }

  async login(req: RequestWithBody<LoginBody>, res: Response<{ accessToken: string }>, next: NextFunction) {
    let agent = req.headers['user-agent'];
    if (!agent) {
      agent = 'default agent';
    }

    const creds: LoginDto = {
      loginOrEmail: req.body.loginOrEmail,
      password: req.body.password,
      ip: req.ip ? req.ip : '',
      title: agent,
    }
    try {
      const { accessToken, refreshToken } = await this.authService.checkCredentials(creds)
      res.status(HttpStatuses.Success)
        .cookie('refreshToken', refreshToken,
          {
            httpOnly: true,
            secure: SETTINGS.ENV === 'testing' ? false : true,
          })
        .send({ accessToken })
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async reissueTokens(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.refreshToken as string
    try {
      const { refreshToken, accessToken } = await this.authService.reissueTokensPair(token)
      res.status(HttpStatuses.Success)
        .cookie('refreshToken', refreshToken,
          {
            httpOnly: true,
            secure: SETTINGS.ENV === 'testing' ? false : true,
          })
        .send({ accessToken })
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.refreshToken as string
    try {
      await this.sessionsService.logout(token)
      res.clearCookie('refreshToken')
        .sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async getUserInfo(req: RequestWithUserId<{ id: string }>, res: Response<MeView>, next: NextFunction) {
    const userId = new ObjectId(req.user!.id)
    try {
      const user = await this.usersQueryRepo.getUserInfo(userId)
      if (!user) {
        throw new Error('User not found')
      }
      res.status(HttpStatuses.Success).send(user);
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async registerUser(req: RequestWithBody<UserInputModel>, res: Response, next: NextFunction) {
    const userInput: UserInputModel = req.body;
    try {
      await this.authService.registerUser(userInput);
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async resendEmailConfirmation(req: RequestWithBody<{ email: string }>, res: Response, next: NextFunction) {
    const email: string = req.body.email;
    try {
      await this.authService.resendConfirmation(email);
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async confirmEmail(req: RequestWithBody<{ code: string }>, res: Response, next: NextFunction) {
    const code: string = req.body.code;
    try {
      await this.authService.confirmEmail(code);
      res.sendStatus(HttpStatuses.NoContent)
      return
    } catch (err) {
      next(err)
      return
    }
  }

  async recoverPassword(req: RequestWithBody<{ email: string }>, res: Response, next: NextFunction) {
    try {
      await this.authService.recoverPassword(req.body.email);
      res.sendStatus(HttpStatuses.NoContent)
    } catch (err) {
      next(err)
      return
    }
  }

  async confirmPassword(req: RequestWithBody<PassRecoveryBody>, res: Response, next: NextFunction) {

    try {
      await this.authService.confirmPassword(
        req.body.recoveryCode,
        req.body.newPassword
      )
      res.sendStatus(204);
    } catch (err) {
      next(err)
      return
    }
  }
}

