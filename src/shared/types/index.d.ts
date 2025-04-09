import { IdType } from "./id.type";

declare global {
  declare namespace Express {
    export interface Request {
      user: IdType | undefined;
    }
  }
}
