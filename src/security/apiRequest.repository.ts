import { ObjectId } from "../shared/types/objectId.type";
import { ApiReqDocument, ApiReqModel } from "./apiRequest.entity";
import { DateTime, Duration } from "luxon";
import { injectable } from "inversify";

@injectable()
export class ApiRequestsRepository {
  async save(request: ApiReqDocument): Promise<ObjectId> {
    const res = await request.save();
    return res._id
  }

  async getRequestsForPeriod(ip: string, URL: string, seconds: number): Promise<ApiReqDocument[]> {
    const timeLimit = DateTime.utc()
      .minus(Duration.fromMillis(seconds * 1000))
      .toJSDate();
    const requests = await ApiReqModel.find(
      {
        ip, URL, date: {
          $gt: timeLimit
        }
      }
    ).exec()
    return requests
  }
}
