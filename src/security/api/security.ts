import { NextFunction, Request, Response } from "express";
import { IDeviceView } from "../session.types";
import { SessionsQueryRepository } from "../sessions.queryRepository";
import { RTokenPayload } from "../../auth/auth.types";
import { JwtService } from "../../auth/jwt.service";
import { RequestWithParams } from "../../shared/types/requests.types";
import { SessionsService } from "../sessions.service";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inject, injectable } from "inversify";

@injectable()
export class SecurityController {
  constructor(
    @inject(SessionsQueryRepository)
    private readonly sessionsQueryRepo: SessionsQueryRepository,
    @inject(SessionsService)
    private readonly sessionsService: SessionsService,
    @inject(JwtService)
    private readonly jwtService: JwtService,
  ) { }

  async getDevices(req: Request, res: Response<IDeviceView[]>, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken as string;
      const rTokenPayload: RTokenPayload = this.jwtService.verifyRefreshToken(token)!;

      const sessions = await this.sessionsQueryRepo.getSessions(rTokenPayload.userId)
      if (!sessions || sessions.length < 1) {
        res.sendStatus(500)
        return
      }
      res.status(HttpStatuses.Success).send(sessions)
      return
    } catch (err) {
      next(err)
    }
  }

  async deleteAnotherSession(req: RequestWithParams<{ deviceId: string }>, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken as string;
      await this.sessionsService.deleteAnotherSession(token, req.params.deviceId);
      res.sendStatus(204)
    } catch (err) {
      next(err);
    }
  }

  async deleteOtherSessions(req: Request, res: Response, next: NextFunction) {
    try {
      await this.sessionsService.deleteOtherSessions(req.cookies.refreshToken)
      res.sendStatus(204)
    } catch (err) {
      next(err);
    }
  }
}
