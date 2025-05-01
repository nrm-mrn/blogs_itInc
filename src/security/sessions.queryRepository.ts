import { sessionsCollection } from "../db/mongoDb"
import { IDeviceView } from "./session.types";

export const sessionsQueryRepository = {
  async getSessions(userId: string): Promise<IDeviceView[] | null> {
    const sessions = await sessionsCollection.find({ userId }).toArray()
    if (!sessions.length) {
      return null
    }
    const res: IDeviceView[] = [];
    sessions.forEach(session => {
      res.push({
        ip: session.ip,
        title: session.title,
        lastActiveDate: session.lastActiveDate,
        deviceId: session._id.toString(),
      })
    })
    return res
  }
}
