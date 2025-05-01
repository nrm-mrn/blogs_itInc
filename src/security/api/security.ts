import { NextFunction, Request, Response, Router } from "express";
import { refreshTokenGuard } from "../../auth/guards/refreshTGuard";
import { IDeviceView } from "../session.types";
import { sessionsQueryRepository } from "../sessions.queryRepository";
import { RTokenPayload } from "../../auth/auth.types";
import { jwtService } from "../../auth/jwt.service";
import { RequestWithParams } from "../../shared/types/requests.types";
import { sessionsService } from "../sessions.service";
import { paramDeviceIdValidator } from "./middleware/sessions.validators";
import { HttpStatuses } from "../../shared/types/httpStatuses";
import { inputValidationResultMiddleware } from "../../shared/middlewares/validationResult.middleware";

export const securityRouter = Router({});

securityRouter.get('/devices',
  refreshTokenGuard,
  async (req: Request, res: Response<IDeviceView[]>, next: NextFunction) => {
    try {
      const token = req.cookies.refreshToken as string;
      const rTokenPayload: RTokenPayload = jwtService.verifyRefreshToken(token)!;

      const sessions = await sessionsQueryRepository.getSessions(rTokenPayload.userId)
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
)

securityRouter.delete('/devices/:deviceId',
  refreshTokenGuard,
  paramDeviceIdValidator,
  inputValidationResultMiddleware,
  async (req: RequestWithParams<{ deviceId: string }>, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.refreshToken as string;
      await sessionsService.deleteAnotherSession(token, req.params.deviceId);
      res.sendStatus(204)
    } catch (err) {
      next(err);
    }
  }
)

securityRouter.delete('/devices',
  refreshTokenGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionsService.deleteOtherSessions(req.cookies.refreshToken)
      res.sendStatus(204)
    } catch (err) {
      next(err);
    }
  }

)

