import { DateTime, Duration } from "luxon";
import { SETTINGS } from "../settings/settings";
import { ObjectId } from "mongodb";

export class DeviceAuthSession {
  _id: ObjectId;
  userId: string;
  lastActiveDate: string;
  expiration: Date;
  ip: string;
  title: string; //NOTE: user-agent header
  constructor(id: ObjectId, userId: string, iat: number, ip: string, title: string) {
    this._id = id;
    this.userId = userId;
    this.lastActiveDate = new Date(iat).toISOString();
    this.ip = ip
    this.title = title
    this.expiration = DateTime
      .utc()
      .plus(Duration.fromMillis(SETTINGS.REFRESHT_TIME * 1000)).toJSDate()
  }
}
