import { ObjectId } from "mongodb";
import { jwtService } from "./jwt.service";
import { DateTime, Duration } from "luxon";
import { SETTINGS } from "../settings/settings";

export class RefreshToken {
  userId: ObjectId;
  token: string;
  createdAt: string;
  expiration: DateTime;
  constructor(userId: string) {
    this.userId = new ObjectId(userId);
    this.token = jwtService.createRefreshToken(userId);
    this.createdAt = DateTime.now().toISO();
    this.expiration = DateTime
      .utc()
      .plus(Duration.fromMillis(SETTINGS.REFRESHT_TIME * 1000));
  }
}
