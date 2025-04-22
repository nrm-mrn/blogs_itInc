import { NextFunction, Response } from "express";
import { jwtService } from "../jwt.service";
import { RequestWithUserId } from "../../shared/types/requests.types";
import { IdType } from "../../shared/types/id.type";

export const jwtGuard = (req: RequestWithUserId<{ id: string }>, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.sendStatus(401);
    return
  }

  const [authType, token] = req.headers.authorization.split(' ')

  if (authType !== 'Bearer') {
    res.sendStatus(401);
    return
  }

  const payload = jwtService.verifyAccessToken(token)
  if (payload) {
    const { userId } = payload;
    req.user = { id: userId } as IdType;
    next()
    return
  }

  res.sendStatus(401);
  return
}
