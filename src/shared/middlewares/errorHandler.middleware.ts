import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types/error.types";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // console.error(err.message)
  // console.error(err.name)
  if (err instanceof CustomError) {
    if (err.errorObj) {
      res.status(err.statusCode).send(err.errorObj)
      return
    } else {
      res.status(err.statusCode).send(err.message)
      return
    }
  }
  // console.error(err.stack)
  res.status(500).send('Server exception')
  return
}
