import { HttpStatuses } from "./httpStatuses";

export type FieldError = {
  message: string | null;
  field: string | null;
}

export type APIErrorResult = {
  errorsMessages: FieldError[] | null;
}

export class CustomError extends Error {
  public statusCode: HttpStatuses;
  public errorObj: APIErrorResult | undefined
  constructor(message: string, statusCode: HttpStatuses, errorObj?: APIErrorResult) {
    super(message)
    this.statusCode = statusCode;
    this.errorObj = errorObj;
  }
}
