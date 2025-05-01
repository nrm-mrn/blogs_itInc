import { param } from "express-validator";
import { ObjectId } from "mongodb";
import { CustomError } from "../../../shared/types/error.types";
import { HttpStatuses } from "../../../shared/types/httpStatuses";

export const paramDeviceIdValidator = param('deviceId')
  .custom((deviceId: string) => {
    const isValidId = ObjectId.isValid(deviceId);
    if (!isValidId) {
      throw new CustomError('Invalid deviceId param', HttpStatuses.BadRequest)
    }
    return true
  })
