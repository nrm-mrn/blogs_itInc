import { DateTime, Duration } from "luxon";
import { SETTINGS } from "../settings/settings";
import { ObjectId } from "mongodb";
import mongoose, { HydratedDocument, Schema } from "mongoose";

export class DeviceAuthSession {
  _id: ObjectId;
  userId: string;
  lastActiveDate: Date;
  expiration: Date;
  ip: string;
  title: string; //NOTE: user-agent header
  constructor(id: ObjectId, userId: string, iat: number, ip: string, title: string) {
    this._id = id;
    this.userId = userId;
    this.lastActiveDate = new Date(iat);
    this.ip = ip
    this.title = title
    this.expiration = DateTime
      .utc()
      .plus(Duration.fromMillis(SETTINGS.REFRESHT_TIME * 1000)).toJSDate()
  }
}

export const DeviceSessionSchema = new Schema<DeviceAuthSession>({
  _id: { type: Schema.ObjectId, required: true },
  userId: { type: String, required: true },
  lastActiveDate: { type: Date, required: true },
  expiration: {
    type: Date,
    required: true,
    index: {
      expireAfterSeconds: 0
    }
  },
  ip: { type: String, required: true },
  title: { type: String, required: true },
})

export const DeviceSessionModel = mongoose.model<DeviceAuthSession>(
  SETTINGS.PATHS.SECURITY,
  DeviceSessionSchema
)

export type SessionDocument = HydratedDocument<DeviceAuthSession>;
