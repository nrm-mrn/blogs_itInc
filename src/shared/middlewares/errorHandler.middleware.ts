import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types/error.types";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message)
  if (err instanceof CustomError) {
    if (err.errorObj) {
      res.status(err.statusCode).send(err.errorObj)
      return
    } else {
      res.status(err.statusCode).send(err.message)
      return
    }
  }
  console.error(JSON.stringify(err, null, 2))
  res.status(500).send('Server exception')
  return
}
