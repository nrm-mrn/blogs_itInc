import { Router } from "express";
import { container } from "../ioc";
import { SecurityController } from "./api/security";
import { refreshTokenGuard } from "../auth/guards/refreshTGuard";
import { paramDeviceIdValidator } from "./api/middleware/sessions.validators";
import { inputValidationResultMiddleware } from "../shared/middlewares/validationResult.middleware";

export const securityRouter = Router({});

const securityController = container.get(SecurityController)

securityRouter.get('/devices',
  refreshTokenGuard,
  securityController.getDevices.bind(securityController)
)

securityRouter.delete('/devices/:deviceId',
  refreshTokenGuard,
  paramDeviceIdValidator,
  inputValidationResultMiddleware,
  securityController.deleteAnotherSession.bind(securityController)
)

securityRouter.delete('/devices',
  refreshTokenGuard,
  securityController.deleteOtherSessions.bind(securityController)
)

