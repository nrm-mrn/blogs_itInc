import { NextFunction, Request, Response } from "express";
import { SETTINGS } from "../settings/settings";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization // Basic xxxx
  if (!auth) {
    res.status(401).send({})
    return;
  }

  const buff = Buffer.from(auth.slice(6), 'base64')
  const decodedAuth = buff.toString('utf8')
  const adminAuth = SETTINGS.SUPERUSER;

  if (decodedAuth !== adminAuth || auth.slice(0, 5) !== 'Basic') {
    res.status(401).send({})
    return;
  }

  next();
}
