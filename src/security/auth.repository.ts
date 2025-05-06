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

  async deleteSession(deviceId: ObjectId): Promise<void> {
    const result = await sessionsCollection
      .deleteOne({ _id: deviceId })
    if (result.acknowledged) {
      return;
    }
    throw new Error('Failed to delete the session, operation not acknowledged by db')
  },

  async getSession(deviceId: ObjectId): Promise<ISessionDb | null> {
    return sessionsCollection
      .findOne({ _id: deviceId })
  },

  async refreshSession(deviceId: ObjectId, iat: string): Promise<void> {
    await sessionsCollection.updateOne(
      { _id: deviceId },
      { $set: { lastActiveDate: iat } })
    return
  }
}
