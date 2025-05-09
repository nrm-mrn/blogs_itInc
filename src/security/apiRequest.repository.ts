import { ObjectId, WithId } from "mongodb";
import { ApiRequest } from "./apiRequest.entity";
import { requestsCollection } from "../db/mongoDb";
import { IRequestDb } from "./apiRequest.types";
import { DateTime, Duration } from "luxon";
import { injectable } from "inversify";

@injectable()
export class ApiRequestsRepository {
  async saveRequest(input: ApiRequest): Promise<ObjectId> {
    const insertRes = await requestsCollection.insertOne(input);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to save a request')
  }

  async getRequestsForPeriod(ip: string, URL: string, seconds: number): Promise<WithId<IRequestDb>[]> {
    const timeLimit = DateTime.utc()
      .minus(Duration.fromMillis(seconds * 1000))
      .toJSDate();
    const requests = await requestsCollection.find(
      {
        ip, URL, date: {
          $gt: timeLimit
        }
      }
    ).toArray();
    return requests
  }
}
