import { NextFunction, Request, Response } from "express";
import { JwtService } from "../jwt.service";
import { container } from "../../ioc";

const jwtService = container.get(JwtService)

export const refreshTokenGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies.refreshToken) {
    res.sendStatus(401);
    return
  }
  const token = req.cookies.refreshToken

  const payload = jwtService.verifyRefreshToken(token)
  if (payload) {
    next()
    return
  }
  res.sendStatus(401);
  return
}
