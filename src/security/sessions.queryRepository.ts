import { injectable } from "inversify";
import { IDeviceView } from "./session.types";
import { DeviceSessionModel } from "./session.entity";

@injectable()
export class SessionsQueryRepository {
  async getSessions(userId: string): Promise<IDeviceView[] | null> {
    const sessions = await DeviceSessionModel.find({ userId }).exec()
    if (!sessions.length) {
      return null
    }
    const res: IDeviceView[] = [];
    sessions.forEach(session => {
      res.push({
        ip: session.ip,
        title: session.title,
        lastActiveDate: session.lastActiveDate.toISOString(),
        deviceId: session._id.toString(),
      })
    })
    return res
  }
}
