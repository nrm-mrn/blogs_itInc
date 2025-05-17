import { NextFunction, Request, Response } from "express";
import { JwtService } from "../jwt.service";
import { IdType } from "../../shared/types/id.type";
import { container } from "../../ioc";

const jwtService = container.get(JwtService);

export const jwtOptionalGuard = (
  req: Request,
  res: Response,
  next: NextFunction) => {
  if (!req.headers.authorization) {
    next()
    return
  }

  const [authType, token] = req.headers.authorization.split(' ')

  if (authType !== 'Bearer') {
    next()
    return
  }

  const payload = jwtService.verifyAccessToken(token)
  if (payload) {
    const { userId } = payload;
    req.user = { id: userId } as IdType;
    next()
    return
  }

  next()
  return
}
