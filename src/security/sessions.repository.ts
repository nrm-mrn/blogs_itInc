import { CustomError } from "../shared/types/error.types";
import { HttpStatuses } from "../shared/types/httpStatuses";
import { ObjectId } from "../shared/types/objectId.type";
import { DeviceSessionModel, SessionDocument } from "./session.entity";
import { injectable } from "inversify";

@injectable()
export class SessionsRepository {

  async save(session: SessionDocument): Promise<ObjectId> {
    const res = await session.save();
    return res._id
  }

  async deleteOtherSessions(lastActiveDate: Date, userId: string): Promise<void> {
    const result = await DeviceSessionModel
      .deleteMany({ userId, lastActiveDate: { $ne: lastActiveDate } })
      .exec()
    if (result.acknowledged) {
      return;
    }
    throw new Error('Failed to delete sessions, operation not acknowledged by db')
  }

  async deleteSession(session: SessionDocument): Promise<void> {
    const result = await session.deleteOne()
    if (result.acknowledged) {
      return;
    }
    throw new Error('Failed to delete the session, operation not acknowledged by db')
  }

  async getSession(deviceId: ObjectId, lastActiveDate: Date): Promise<SessionDocument> {
    const session = await DeviceSessionModel
      .findOne({ _id: deviceId, lastActiveDate })
      .orFail(
        new CustomError('Session does not exist or already expired', HttpStatuses.Unauthorized)
      )
    return session
  }


  //WARN: Unsafe without checking iat of the token presenter
  async findSessionByDeviceId(deviceId: ObjectId): Promise<SessionDocument | null> {
    return DeviceSessionModel
      .findOne({ _id: deviceId })
  }
}
