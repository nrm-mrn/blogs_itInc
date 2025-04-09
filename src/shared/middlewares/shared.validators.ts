import { param } from "express-validator";
import { ObjectId } from "mongodb";

export const paramObjectIdValidator = param('id')
  .custom((id: string) => {
    const isValidId = ObjectId.isValid(id);
    if (!isValidId) {
      throw new Error('Invalid id param')
    }
    return true
  })
