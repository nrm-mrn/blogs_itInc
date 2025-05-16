import { DateTime } from "luxon";
import mongoose, { HydratedDocument } from "mongoose";
import { SETTINGS } from "../settings/settings";

export class ApiRequest {
  ip: string;
  URL: string;
  date: Date;
  constructor(ip: string, URL: string) {
    this.ip = ip;
    this.URL = URL;
    this.date = DateTime.utc().toJSDate();
  }
}

export const ApiReqSchema = new mongoose.Schema<ApiRequest>({
  ip: { type: String, required: true },
  URL: { type: String, required: true },
  date: {
    type: Date,
    required: true,
    index: {
      expireAfterSeconds: SETTINGS.REQUESTS_LIFETIME
    }
  }
})

export const ApiReqModel = mongoose.model<ApiRequest>(
  SETTINGS.PATHS.REQUESTS,
  ApiReqSchema
)

export type ApiReqDocument = HydratedDocument<ApiRequest>
