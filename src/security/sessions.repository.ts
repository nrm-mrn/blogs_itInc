import { ObjectId } from "mongodb";
import { DeviceAuthSession } from "./session.entity";
import { sessionsCollection } from "../db/mongoDb";
import { ISessionDb } from "./session.types";

export const sessionsRepository = {
  async saveSession(session: DeviceAuthSession): Promise<ObjectId> {
    const insertRes = await sessionsCollection.insertOne(session);
    if (insertRes.acknowledged) {
      return insertRes.insertedId
    }
    throw new Error('Failed to save session')
  },

  async deleteOtherSessions(lastActiveDate: string, userId: string): Promise<void> {
    const result = await sessionsCollection
      .deleteMany({
        userId,
        lastActiveDate: { $ne: lastActiveDate }
      })
    if (result.acknowledged) {
      return;
    }
    throw new Error('Failed to delete sessions, operation not acknowledged by db')
  },

  async deleteSession(iat: string): Promise<void> {
    const result = await sessionsCollection
      .deleteOne({ lastActiveDate: iat })
    if (result.acknowledged) {
      return;
    }
    throw new Error('Failed to delete the session, operation not acknowledged by db')
  },

  async getSession(deviceId: ObjectId, iat: string): Promise<ISessionDb | null> {
    return sessionsCollection
      .findOne({ _id: deviceId, lastActiveDate: iat })
  },

  //WARN: Unsafe without checking iat of the token presenter
  async getSessionByDeviceId(deviceId: ObjectId): Promise<ISessionDb | null> {
    return sessionsCollection
      .findOne({ _id: deviceId })
  },

  async refreshSession(deviceId: ObjectId, iat: string): Promise<void> {
    const res = await sessionsCollection.updateOne(
      { _id: deviceId, },
      { $set: { lastActiveDate: iat } })
    if (res.modifiedCount === 1) {
      return;
    }
    throw new Error('Failed to update session, modified count not 1')
  }
}
