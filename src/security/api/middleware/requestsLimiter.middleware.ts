import { NextFunction, Request, Response } from "express";
import { SETTINGS } from "../../../settings/settings";
import { ApiRequestService } from "../../apiRequest.service";
import { CreateRequestDto } from "../../apiRequest.types";
import { container } from "../../../ioc";

const apiRequestService = container.get(ApiRequestService)

export const requestsLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip!;
  const URL = req.originalUrl;
  const timeLimit = SETTINGS.REQUESTS_LIFETIME;

  const count = await apiRequestService.getDocsCountForPeriod(
    ip,
    URL,
    timeLimit
  )
  if (count > 4) {
    res.sendStatus(429);
    return;
  }
  const newRequest: CreateRequestDto = { ip, URL };
  apiRequestService.saveRequest(newRequest).catch(err => {
    throw new Error(`Could not save request: ${err}`)
  })
  next();
  return;
  }
